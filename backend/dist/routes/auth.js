import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
const prisma = new PrismaClient();
export const auth = Router();
async function signup(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ "message": "All the fields are required!" });
        }
        await prisma.user.create({
            data: {
                email,
                password
            },
        });
        return res.status(200).json({ "message": "Signup done!" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ "error": "Internal server error!" });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ "message": "All the fields are required!" });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ "message": "Invalid Email!" });
        }
        if (user.password !== password) {
            return res.status(401).json({ "message": "Invalid Password" });
        }
        const payload = {
            userId: user.id,
            email: user.email,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || "", {
            expiresIn: "1h",
        });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        return res.status(200).json({ "message": "Login done!" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ " error": "Internal server error! " });
    }
}
auth.post("/login", login);
auth.post("/signup", signup);
//# sourceMappingURL=auth.js.map