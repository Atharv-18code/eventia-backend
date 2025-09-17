import { Router } from "express";
import { bookTicket } from "../controllers/ticketBookingController";

const router = Router();

router.post("/book", bookTicket);

export default router;
