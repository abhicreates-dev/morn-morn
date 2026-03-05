import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authenticate, type AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    completeInHours: z.number().positive(),
    aiSuggestion: z.string().optional(),
});

router.post("/", async (req: AuthRequest, res) => {
    try {
        const parsedData = createTaskSchema.parse(req.body);

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
            },
        });

        res.status(201).json(task);
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
            return res.status(400).json({ message: "Validation error", errors: error.errors });
        }
        console.error("Complete task error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export { router as tasksRouter };
