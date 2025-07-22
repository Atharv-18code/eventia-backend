import { Request, Response } from "express";
import { ApiResponse, Event } from "../../types";
import logger from "../config/logger.config";
import { EventService } from "../services/event.service";
import path from "path";

const EventController = {
    /**
     * Create a new event.
     * @param req - Request containing event data
     * @param res - Response to send the result
     * @returns Response with created event or error
     */
    createEvent: async (req: Request, res: Response): Promise<any> => {
        try {
            const { title, description, category, date, isPublic, venueId, ticketPrices } = req.body;
            const organizerId = req.user?.id;

            const image = req.file;

            if (!organizerId) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: "User ID not found in request",
                };
                return res.status(400).json(response);
            }

            let imageUrl = undefined;
            if (image) {
                imageUrl = path.join(__dirname, "../public/uploads", image.filename);
            }

            const isPublicBoolean = isPublic === "true";

            const result = await EventService.createEvent(
                title,
                description,
                category,
                new Date(date),
                isPublicBoolean,
                organizerId,
                ticketPrices,
                venueId,
                imageUrl,
            );

            if ('error' in result) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: result.error,
                };
                logger.error(result.error);
                return res.status(400).json(response);
            }

            const response: ApiResponse<Event> = {
                timestamp: Date.now(),
                success: true,
                data: result as Event,
                message: "Event created successfully",
                error: "",
            };

            logger.info("Event created successfully");
            return res.status(201).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            return res.status(500).json(response);
        }
    },

    /**
     * Get all events.
     * @param req - Request to get events
     * @param res - Response to send the events data
     * @returns Response with events data
     */
    getAllEvents: async (req: Request, res: Response): Promise<any> => {
        try {
            const events = await EventService.getAllEvents();
            const response: ApiResponse<Event[]> = {
                timestamp: Date.now(),
                success: true,
                data: events,
                message: "Events fetched successfully",
                error: "",
            };
            return res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            return res.status(500).json(response);
        }
    },

    /**
     * Get all events.
     * @param req - Request to get events
     * @param res - Response to send the events data
     * @returns Response with events data
     */
    getAllPublicEvents: async (req: Request, res: Response): Promise<any> => {
        try {
            const events = await EventService.getAllPublicEvents();
            const response: ApiResponse<Event[]> = {
                timestamp: Date.now(),
                success: true,
                data: events,
                message: "Public Events fetched successfully",
                error: "",
            };
            return res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            return res.status(500).json(response);
        }
    },

    /**
     * Get events by organizer ID.
     * @param req - Request containing the organizer's ID
     * @param res - Response with events data
     * @returns Response with events data
     */
    getEventsByOrganizer: async (req: Request, res: Response): Promise<any> => {
        try {
            const organizerId = req.params.organizerId;
            const events = await EventService.getEventsByOrganizer(organizerId);

            const response: ApiResponse<Event[]> = {
                timestamp: Date.now(),
                success: true,
                data: events,
                message: "Events fetched successfully",
                error: "",
            };

            return res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            return res.status(500).json(response);
        }
    },

    /**
     * Get an event by ID.
     * @param req - Request containing the event ID
     * @param res - Response with event data
     * @returns Response with event data or error
     */
    getEventById: async (req: Request, res: Response): Promise<any> => {
        try {
            const eventId = req.params.eventId;
            const event = await EventService.getEventById(eventId);

            if (!event) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: "Event not found",
                };
                return res.status(404).json(response);
            }

            const response: ApiResponse<Event> = {
                timestamp: Date.now(),
                success: true,
                data: event,
                message: "Event fetched successfully",
                error: "",
            };

            return res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            return res.status(500).json(response);
        }
    },

    getUpcomingPublicEvents: async (req: Request, res: Response): Promise<any> => {
        try {
            const events = await EventService.getUpcomingPublicEvents(3);
            const response: ApiResponse<Event[]> = {
                timestamp: Date.now(),
                success: true,
                data: events,
                message: "Upcoming public events fetched successfully",
                error: "",
            };
            return res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");
            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };
            return res.status(500).json(response);
        }
    },

    /**
     * Update an event.
     * @param req - Request containing event data
     * @param res - Response with success or error
     * @returns Response with updated event or error
     */
    updateEvent: async (req: Request, res: Response): Promise<any> => {
        try {
            const eventId = req.params.eventId;
            const data = req.body;
            const result = await EventService.updateEvent(eventId, data);

            if ('error' in result) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: result.error,
                };
                return res.status(400).json(response);
            }

            const response: ApiResponse<Event> = {
                timestamp: Date.now(),
                success: true,
                data: result as Event,
                message: "Event updated successfully",
                error: "",
            };

            return res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            return res.status(500).json(response);
        }
    },

    /**
     * Delete an event.
     * @param req - Request containing event ID
     * @param res - Response with success or error
     * @returns Response with success or error
     */
    deleteEvent: async (req: Request, res: Response): Promise<any> => {
        try {
            const eventId = req.params.eventId;
            const result = await EventService.deleteEvent(eventId);

            if (!result.success) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: result.error || "Error deleting event",
                };
                return res.status(400).json(response);
            }

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: true,
                data: null,
                message: "Event deleted successfully",
                error: "",
            };

            return res.status(200).json(response);
        } catch (err) {
            logger.error(err instanceof Error ? err.message : "Server error");

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: false,
                data: null,
                message: "",
                error: "Server error",
            };

            return res.status(500).json(response);
        }
    },
};

export default EventController;
