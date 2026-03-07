import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { getEscrowPublicKey } from "../escrow";

const router = Router();

router.use(authenticate);

const STAKE_LAMPORTS = "10000000"; // 0.01 SOL

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    completeInHours: z.number().positive(),
    aiSuggestion: z.string().optional(),
    userWalletAddress: z.string().min(32).optional(),
});

router.post("/", async (req: AuthRequest, res) => {
    try {
        const parsedData = createTaskSchema.parse(req.body);
        const withStake = !!parsedData.userWalletAddress;

        const now = new Date();
        const deadlineTimestamp = new Date(now.getTime() + parsedData.completeInHours * 60 * 60 * 1000);

        const task = await prisma.task.create({
            data: {
                title: parsedData.title,
                description: parsedData.description,
                completeInHours: parsedData.completeInHours,
                aiSuggestion: parsedData.aiSuggestion,
                dateCreated: now,
                deadlineTimestamp,
                userId: req.userId!,
                userWalletAddress: parsedData.userWalletAddress ?? null,
                stakeAmountLamports: withStake ? STAKE_LAMPORTS : null,
            },
        });

        if (!withStake) {
            return res.status(201).json(task);
        }

        const escrowAddress = getEscrowPublicKey();
        res.status(201).json({
            ...task,
            escrowAddress,
            stakeAmountLamports: STAKE_LAMPORTS,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.errors });
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

const confirmStakeSchema = z.object({
    txSignature: z.string(),
});

router.post("/:id/confirm-stake", async (req: AuthRequest, res) => {
    try {
        const taskId = req.params.id;
        const { txSignature } = confirmStakeSchema.parse(req.body);

        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) return res.status(404).json({ message: "Task not found" });
        if (task.userId !== req.userId) return res.status(403).json({ message: "Forbidden" });
        if (task.stakeReceivedAt) return res.status(400).json({ message: "Stake already confirmed" });

        await prisma.task.update({
            where: { id: taskId },
            data: { stakeReceivedAt: new Date() },
        });

        res.json({ ok: true, message: "Stake confirmed" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        console.error("Confirm stake error:", error);
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

        let refundTxSignature: string | null = null;
        if (
            parsedData.success &&
            task.stakeReceivedAt &&
            task.userWalletAddress &&
            task.stakeAmountLamports
        ) {
            try {
                const { sendSolTo } = await import("../escrow");
                refundTxSignature = await sendSolTo(
                    task.userWalletAddress,
                    BigInt(task.stakeAmountLamports)
                );
            } catch (err) {
                console.error("Refund failed:", err);
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

        res.json({ ...updatedTask, refundTxSignature: refundTxSignature ?? undefined });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        console.error("Complete task error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export { router as tasksRouter };
