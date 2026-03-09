import express from "express";
import cors from "cors";
import { prisma } from './db';
import "dotenv/config";

import { authRouter } from "./routes/auth";
import { tasksRouter } from "./routes/tasks";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
});

app.use("/auth", authRouter);
app.use("/tasks", tasksRouter);

// Basic health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);

    // Background job to expire tasks every minute
    setInterval(async () => {
        try {
            const now = new Date();
            const expiredTasks = await prisma.task.updateMany({
                where: {
                    deadlineTimestamp: { lte: now },
                    completed: false,
                    challengeStop: false,
                },
                data: {
                    challengeStop: true,
                    aiVerdict: false, // Default to failed if time ran out
                },
            });
            if (expiredTasks.count > 0) {
                console.log(`Expired ${expiredTasks.count} past-due tasks`);
            }
        } catch (error) {
            console.error("Error in expiration job:", error);
        }
    }, 60 * 1000);
});

export { app, prisma };