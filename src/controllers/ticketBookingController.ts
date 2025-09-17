import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const bookTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, eventId, seatType, ticketCount, paymentMethod } = req.body;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const ticketPrices = event.ticketPrices as {
      seatType: string;
      price: number;
      availableSeats: number;
    }[];

    const ticket = ticketPrices.find((t) => t.seatType === seatType);
    if (!ticket) {
      res.status(400).json({ error: "Invalid seat type" });
      return;
    }

    if (ticket.availableSeats < ticketCount) {
      res.status(400).json({ error: "Not enough seats available" });
      return;
    }

    const totalAmount = ticket.price * ticketCount;

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: totalAmount,
        paymentMethod,
        status: "PENDING",
      },
    });

    const booking = await prisma.ticketBooking.create({
      data: {
        userId,
        eventId,
        seatType,
        ticketCount,
        paymentId: payment.id,
        status: "PENDING",
      },
    });

    // Update available seats
    ticket.availableSeats -= ticketCount;
    await prisma.event.update({
      where: { id: eventId },
      data: { ticketPrices },
    });

    res.json({ success: true, booking, payment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
