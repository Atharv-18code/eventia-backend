import rateLimit from "express-rate-limit";

const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        timestamp: Date.now(),
        success: false,
        data: null,
        message: "",
        error: "Too many requests. Please try again later.",
    },
});

export default rateLimiter;
