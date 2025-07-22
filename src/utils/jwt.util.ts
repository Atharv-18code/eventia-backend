import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../config/logger.config";

dotenv.config();

const secretKey = process.env.JWT_SECRET!;

if (!secretKey) {
    logger.error("Jwt secret must be set in environment variables.");
}

export const generateToken = (payload: object) => {
    return jwt.sign(payload, secretKey, { expiresIn: "1d" });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, secretKey);
};