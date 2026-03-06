import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { PublicKey } from "@solana/web3.js";
import {
    DEPOSIT_LAMPORTS,
    DEPOSIT_SOL,
    getEscrowPublicKey,
    verifyDevnetDepositTx,
    sendEscrowPayout,
} from "../solana";

const router = Router();

router.use(authenticate);

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    completeInHours: z.number().positive(),
    aiSuggestion: z.string().optional(),
    solanaTransactionSignature: z.string().min(1),
    walletAddress: z.string().min(1),
});

router.post("/", async (req: AuthRequest, res) => {
    try {
        const parsedData = createTaskSchema.parse(req.body);

        const now = new Date();
        const deadlineTimestamp = new Date(now.getTime() + parsedData.completeInHours * 60 * 60 * 1000);

        const escrow = getEscrowPublicKey().toBase58();

        // Ensure tx signature not reused
        const existing = await prisma.task.findUnique({
            where: { solanaTxSignature: parsedData.solanaTransactionSignature },
            select: { id: true },
        });
        if (existing) {
            return res.status(400).json({ message: "Transaction signature already used" });
        }

        // Verify devnet deposit was exactly 0.1 SOL from wallet -> escrow
        try {
            // Validate wallet address formatting early (fails fast for obvious bad input)
            // (PublicKey constructor will throw on invalid base58)
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            new PublicKey(parsedData.walletAddress);

            await verifyDevnetDepositTx({
                signature: parsedData.solanaTransactionSignature,
                expectedFrom: parsedData.walletAddress,
                expectedTo: escrow,
                expectedLamports: DEPOSIT_LAMPORTS,
            });
        } catch (e) {
            return res.status(400).json({ message: "Invalid deposit transaction" });
        }

        const task = await prisma.task.create({
            data: {
                title: parsedData.title,
                description: parsedData.description,
                completeInHours: parsedData.completeInHours,
                aiSuggestion: parsedData.aiSuggestion,
                dateCreated: now,
                deadlineTimestamp,
                userId: req.userId!,
                walletAddress: parsedData.walletAddress,
                depositAmount: DEPOSIT_SOL,
                solanaTxSignature: parsedData.solanaTransactionSignature,
            },
        });

        res.status(201).json(task);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        console.error("Create task error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/today", async (req: AuthRequest, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const tasks = await prisma.task.findMany({
            where: {
                userId: req.userId!,
                dateCreated: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
            orderBy: {
                dateCreated: "desc",
            },
        });

        res.json(tasks);
    } catch (error) {
        console.error("Fetch today tasks error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const completeTaskSchema = z.object({
    taskId: z.string(),
    success: z.boolean(),
    proofImageUrl: z.string().optional(),
    proofExplanation: z.string().optional(),
});

router.post("/complete", async (req: AuthRequest, res) => {
    try {
        const parsedData = completeTaskSchema.parse(req.body);

        const task = await prisma.task.findUnique({
            where: { id: parsedData.taskId },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        if (task.userId !== req.userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (task.challengeStop) {
            return res.status(400).json({ message: "Task already finalized" });
        }

        // If success, payout exactly 0.1 SOL from escrow -> user wallet, then finalize task.
        if (parsedData.success) {
            try {
                await sendEscrowPayout({
                    to: task.walletAddress,
                    lamports: DEPOSIT_LAMPORTS,
                });
            } catch (e) {
                console.error("Escrow payout error:", e);
                return res.status(502).json({ message: "Payout failed; task not finalized" });
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id: parsedData.taskId },
            data: {
                completed: parsedData.success,
                challengeStop: true,
                aiVerdict: parsedData.success,
                proofImageUrl: parsedData.proofImageUrl,
                proofExplanation: parsedData.proofExplanation,
            },
        });

        res.json(updatedTask);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        console.error("Complete task error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export { router as tasksRouter };
