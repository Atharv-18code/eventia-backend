import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import logger from "./config/logger.config";
import rateLimiter from "./middlewares/rateLimiter.middleware";
import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/events.routes";
import venueRoutes from "./routes/venues.routes";
import path from "path";

const app = express();
dotenv.config();
const PORT = process.env.SERVER_PORT || 3000;

const corsOptions = {
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: false,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(rateLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/venues", venueRoutes);

app.get("/health", (_, res) => {
    logger.info("Health check endpoint was called.");
    res.status(200).json({ message: "Server is running!" });
});

app.listen(PORT, () => {
    console.log(`Server listening on: http://localhost:${PORT}`);
});