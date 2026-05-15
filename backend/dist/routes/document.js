import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();
const prisma = new PrismaClient();
// =========================================================
// 🔥 CREATE DOCUMENT
// =========================================================
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const document = await prisma.document.create({
            data: {
                title: "Untitled Document",
                content: "",
                userId,
            },
        });
        res.json({
            document,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to create document",
        });
    }
});
// =========================================================
// 🔥 RECENT DOCUMENTS
// =========================================================
router.get("/recent", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const documents = await prisma.document.findMany({
            where: {
                userId,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        res.json({
            documents,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch documents",
        });
    }
});
export default router;
//# sourceMappingURL=document.js.map