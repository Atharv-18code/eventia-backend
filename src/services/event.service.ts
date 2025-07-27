import { Event } from "@prisma/client";
import cloudinary from "../config/cloudinary.config";
import logger from "../config/logger.config";
import prisma from "../config/prisma.config";

export const EventService = {
  /**
   * Create a new event.
   * @param title - Event title
   * @param description - Event description
   * @param category - Event category
   * @param date - Event date
   * @param isPublic - Whether the event is public
   * @param organizerId - The user ID of the organizer
   * @param venueId - The venue ID (optional)
   * @param imageUrl - The image URL for the event (optional)
   * @param ticketPrices - The ticket prices for the event
   * @returns Object with the created event or error
   */
  createEvent: async (
    title: string,
    description: string,
    category: string,
    date: Date,
    isPublic: boolean,
    organizerId: string,
    ticketPrices: string,
    venueId?: string,
    imageUrl?: string
  ): Promise<Event | { error: string }> => {
    try {
      let uploadedImageUrl = "";
      let parsedTicketPrices = [];

      if (ticketPrices) {
        try {
          parsedTicketPrices =
            typeof ticketPrices === "string"
              ? JSON.parse(ticketPrices)
              : ticketPrices;

          if (!Array.isArray(parsedTicketPrices)) {
            return { error: "Ticket prices must be an array of objects" };
          }

          logger.info("Parsed ticket prices:", parsedTicketPrices);
        } catch (parseError) {
          return { error: "Invalid ticket prices JSON format" };
        }
      }

      if (imageUrl) {
        const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
          folder: "uploads",
        });
        uploadedImageUrl = uploadResponse.secure_url;
      }

      const newEvent = await prisma.event.create({
        data: {
          title,
          description,
          category,
          date,
          isPublic,
          organizerId,
          venueId,
          image: uploadedImageUrl,
          ticketPrices: parsedTicketPrices,
        },
      });
      return newEvent;
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return { error: `Error creating event: ${error.message}` };
      } else {
        return { error: "Error creating event" };
      }
    }
  },

  /**
   * Get all events.
   * @returns List of events
   */
  getAllEvents: async (): Promise<Event[]> => {
    try {
      return await prisma.event.findMany();
    } catch (error) {
      throw new Error("Error fetching events");
    }
  },

  /**
   * Get all public events.
   * @returns List of all public events
   */
  getAllPublicEvents: async (): Promise<Event[]> => {
    try {
      return await prisma.event.findMany({
        where: {
          isPublic: true,
        },
        include: {
          organizer: true,
          venue: true,
          ticketBookings: true,
        },
      });
    } catch (error) {
      throw new Error("Error fetching public events");
    }
  },

  /**
   * Get events by organizer ID.
   * @param organizerId - Organizer's user ID
   * @returns List of events organized by the user
   */
  getEventsByOrganizer: async (organizerId: string): Promise<Event[]> => {
    try {
      return await prisma.event.findMany({
        where: { organizerId },
        include: { venue: true },
      });
    } catch (error) {
      throw new Error("Error fetching events for this organizer");
    }
  },

  /**
   * Get an event by ID.
   * @param id - Event ID
   * @returns Event data
   */
  getEventById: async (id: string): Promise<Event | null> => {
    try {
      return await prisma.event.findUnique({
        where: { id },
        include: {
          organizer: true,
          venue: true,
          ticketBookings: true,
        },
      });
    } catch (error) {
      throw new Error("Error fetching event by ID");
    }
  },

  /**
   * Get upcoming public events.
   * @param limit - Number of events to fetch
   * @returns List of upcoming public events
   */
  getUpcomingPublicEvents: async (limit: number = 3): Promise<Event[]> => {
    try {
      const events = await prisma.event.findMany({
        where: { isPublic: true, date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: limit,
        include: {
          organizer: true,
          venue: true,
          ticketBookings: true,
        },
      });
      return events;
    } catch (err) {
      console.error("Error fetching upcoming public events:", err);
      throw new Error("Failed to fetch upcoming public events");
    }
  },

  /**
   * Update an event's details.
   * @param id - Event ID
   * @param data - Event data to update
   * @returns Updated event or error
   */
  updateEvent: async (
    id: string,
    data: Partial<Event>
  ): Promise<Event | { error: string }> => {
    try {
      return await prisma.event.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          date: data.date,
          isPublic: data.isPublic,
          image: data.image,
          venueId: data.venueId,
          ticketPrices: data.ticketPrices ?? undefined,
        },
      });
    } catch (error) {
      return { error: "Error updating event" };
    }
  },

  /**
   * Delete an event.
   * @param id - Event ID
   * @returns Success or error
   */
  deleteEvent: async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await prisma.event.delete({
        where: { id },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: "Error deleting event" };
    }
  },
};
