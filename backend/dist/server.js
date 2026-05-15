import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { auth } from "./routes/auth.js";
import documentRoutes from "./routes/document.js";
const app = express();
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/auth", auth);
app.use("/api/v1/document", documentRoutes);
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
const prisma = new PrismaClient();
const rooms = {};
io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);
    // =========================================================
    // 🔥 JOIN DOCUMENT
    // =========================================================
    socket.on("join-doc", async (docId) => {
        try {
            // 🔥 Leave old rooms
            for (const room of socket.rooms) {
                if (room !== socket.id) {
                    socket.leave(room);
                    if (rooms[room]) {
                        rooms[room].delete(socket.id);
                        io.to(room).emit("users", Array.from(rooms[room]));
                        if (rooms[room].size === 0) {
                            delete rooms[room];
                        }
                    }
                }
            }
            // 🔥 Join new room
            socket.join(docId);
            // 🔥 Init room
            if (!rooms[docId]) {
                rooms[docId] = new Set();
            }
            rooms[docId].add(socket.id);
            // 🔥 Fetch document from DB
            const document = await prisma.document.findUnique({
                where: {
                    id: docId,
                },
            });
            // ❌ Document not found
            if (!document) {
                socket.emit("error", "Document not found");
                return;
            }
            // ✅ FIXED INIT PAYLOAD
            socket.emit("init", {
                title: document.title,
                content: document.content,
            });
            // 🔥 Broadcast active users
            io.to(docId).emit("users", Array.from(rooms[docId]));
            console.log("Rooms:", rooms);
        }
        catch (error) {
            console.error("Join doc error:", error);
        }
    });
    // =========================================================
    // 🔥 REALTIME DOCUMENT UPDATE
    // =========================================================
    socket.on("update-doc", ({ docId, content, }) => {
        // ✅ FIXED
        socket.to(docId).emit("receive-update", content);
    });
    // =========================================================
    // 🔥 SAVE DOCUMENT
    // =========================================================
    socket.on("save-doc", async ({ docId, content, }) => {
        try {
            console.log("Saving document:", docId);
            const updatedDocument = await prisma.document.update({
                where: {
                    id: docId,
                },
                data: {
                    content,
                },
            });
            console.log("Document saved successfully:", updatedDocument.id);
        }
        catch (error) {
            console.error("Save doc error:", error);
        }
    });
    // =========================================================
    // 🔥 UPDATE TITLE
    // =========================================================
    socket.on("update-title", async ({ docId, title, }) => {
        try {
            await prisma.document.update({
                where: {
                    id: docId,
                },
                data: {
                    title,
                },
            });
            io.to(docId).emit("receive-title-update", title);
        }
        catch (error) {
            console.error("Update title error:", error);
        }
    });
    // =========================================================
    // 🔥 CURSOR MOVE
    // =========================================================
    socket.on("cursor-move", ({ docId, cursor, user, }) => {
        if (!rooms[docId])
            return;
        socket.to(docId).emit("cursor-update", {
            socketId: socket.id,
            cursor,
            user,
        });
    });
    // =========================================================
    // 🔥 DISCONNECT
    // =========================================================
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        for (const docId in rooms) {
            const room = rooms[docId];
            if (!room)
                continue;
            if (room.has(socket.id)) {
                room.delete(socket.id);
                io.to(docId).emit("users", Array.from(room));
                if (room.size === 0) {
                    delete rooms[docId];
                }
            }
        }
        console.log("Rooms after disconnect:", rooms);
    });
});
server.listen(5000, () => {
    console.log("Server is running on port 5000 🚀");
});
//# sourceMappingURL=server.js.map