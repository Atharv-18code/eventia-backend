import { createLogger, format, transports } from "winston";

const logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new transports.File({ filename: "logs/error.log", level: "error" }),
        new transports.File({ filename: "logs/combined.log" }),
    ],
    exceptionHandlers: [
        new transports.File({ filename: "logs/exceptions.log" }),
    ],
});

// Add console logging only for development
if (process.env.NODE_ENV !== "production" && !logger.transports.some(t => t instanceof transports.Console)) {
    logger.add(
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} [${level}]: ${message}`;
                })
            ),
        })
    );
}

export default logger;
