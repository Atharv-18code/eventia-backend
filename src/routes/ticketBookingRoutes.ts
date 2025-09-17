import { Router } from "express";
import { createOrder, verifyPayment } from "../controllers/ticketBookingController";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/create-order", authenticate, createOrder);
router.post("/verify-payment", authenticate, verifyPayment);

export default router;
