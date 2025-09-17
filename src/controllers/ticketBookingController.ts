import {Request, Response} from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../config/prisma.config';
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    console.log('Request body:', req.body);
    const {eventId, numberOfTickets, amount} = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({error: 'User not authenticated'});
    }

    console.log('Looking for event:', eventId);
    const event = await prisma.event.findUnique({
      where: {id: eventId},
    });

    if (!event) {
      console.log('Event not found');
      return res.status(404).json({error: 'Event not found'});
    }

    const options = {
      amount: Math.round(amount * 100), // amount in paise, ensure it's a whole number
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    console.log('Creating Razorpay order:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order);

    // Create the payment and ticket booking in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First create the payment
      console.log('Creating payment record');
      const payment = await tx.payment.create({
        data: {
          userId,
          amount: parseFloat(amount.toString()),
          status: 'PENDING',
          paymentMethod: 'RAZORPAY',
        },
      });
      console.log('Payment record created:', payment);

      // Then create the ticket booking
      console.log('Creating ticket booking');
      const ticketBooking = await tx.ticketBooking.create({
        data: {
          eventId,
          userId,
          ticketCount: numberOfTickets,
          seatType: 'REGULAR',
          status: 'PENDING',
          paymentId: payment.id,
        },
      });
      console.log('Ticket booking created:', ticketBooking);

      return { payment, ticketBooking };
    });

    console.log('Transaction completed successfully:', result);
    res.json({ orderId: order.id });

    res.json({orderId: order.id});
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({error: 'Failed to create order'});
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({error: 'Invalid signature'});
    }

    // Update ticket booking and payment status
    const payment = await prisma.payment.findFirst({
      where: { paymentMethod: 'RAZORPAY' },
      orderBy: { createdAt: 'desc' },
      include: { ticketBookings: true }
    });

    if (!payment) {
      return res.status(404).json({error: 'Payment not found'});
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' }
    });

    const ticketBooking = await prisma.ticketBooking.update({
      where: { id: payment.ticketBookings[0].id },
      data: { status: 'CONFIRMED' }
    });

    res.json({success: true, ticketBooking});
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({error: 'Payment verification failed'});
  }
};
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
