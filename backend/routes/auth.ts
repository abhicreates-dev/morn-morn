import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db";
import { JWT_SECRET } from "../middleware/auth";

const router = Router();

const signupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

router.post("/signup", async (req, res) => {
    try {
        const parsedData = signupSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: { email: parsedData.email },
        });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const hashedPassword = await bcrypt.hash(parsedData.password, 10);

        const user = await prisma.user.create({
            data: {
                name: parsedData.name,
                email: parsedData.email,
                password: hashedPassword,
            },
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const parsedData = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email: parsedData.email },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(parsedData.password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Validation error", errors: error.issues });
        }
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export { router as authRouter };
