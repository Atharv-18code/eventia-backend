import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.util";
import logger from "../config/logger.config";
import { ApiResponse } from "../../types";

export const authenticate = (req: Request, res: Response, next: NextFunction): any => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            logger.error("Token is required");
            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Token is required",
            };
            return res.status(401).json(response);
        }

        const decoded = verifyToken(token) as { id: string; role: string };
        req.user = decoded;
        next();
    } catch (err) {
        logger.error("Invalid token", err);
        const response: ApiResponse<null> = {
            timestamp: Date.now(),
            success: false,
            data: null,
            message: "",
            error: "Invalid token",
        };
        return res.status(401).json(response);
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): any => {
        if (!roles.includes(req.user?.role!)) {
            logger.error("Forbidden: Access Denied");
            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Forbidden: Access Denied",
            };
            return res.status(403).json(response);
        }
        next();
    };
};
