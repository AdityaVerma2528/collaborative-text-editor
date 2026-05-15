import jwt from "jsonwebtoken";
export function authMiddleware(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ "message": "Unauthorised " });
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "");
        // @ts-ignore
        req.userId = payload.userId;
        next();
    }
    catch {
        return res.status(401).json({ "message": "Invalid or expired token" });
    }
}
//# sourceMappingURL=authMiddleware.js.map