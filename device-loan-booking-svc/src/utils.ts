import { HttpRequest, InvocationContext } from "@azure/functions";
import * as jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "super-secret-key-for-demo";

export interface UserPayload {
    userId: string;
    role: "student" | "staff";
}

export function generateToken(user: UserPayload): string {
    return jwt.sign(user, SECRET_KEY, { expiresIn: "1h" });
}

export function verifyToken(request: HttpRequest): UserPayload | null {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];
    try {
        return jwt.verify(token, SECRET_KEY) as UserPayload;
    } catch (e) {
        return null;
    }
}

export const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || "http://localhost:7071";
