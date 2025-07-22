import { Venue, VenueBooking } from "@prisma/client";
import { Request, Response } from "express";
import path from "path";
import { ApiResponse } from "../../types";
import logger from "../config/logger.config";
import { VenueService } from "../services/venue.service";
import { mapServiceToValue } from "../utils/service-tier.util";

const VenueController = {
    /**
     * Create a new venue.
     * @param req - Request containing venue data
     * @param res - Response to send the result
     * @returns Response with created venue or error
     */
    createVenue: async (req: Request, res: Response): Promise<any> => {
        try {
            const { name, location, capacity, pricePerDay, description } = req.body;
            const image = req.file;

            let imageUrl = undefined;
            if (image) {
                imageUrl = path.join(__dirname, "../public/uploads", image.filename);
            }

            const parsedCapacity = parseInt(capacity);
            const parsedPricePerDay = parseFloat(pricePerDay);

            const result = await VenueService.createVenue(
                name,
                location,
                parsedCapacity,
                parsedPricePerDay,
                description,
                imageUrl
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

            const response: ApiResponse<Venue> = {
                timestamp: Date.now(),
                success: true,
                data: result as Venue,
                message: "Venue created successfully",
                error: "",
            };

            logger.info("Venue created successfully");
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
     * Get all venues.
     * @param req - Request to get venues
     * @param res - Response to send the venues data
     * @returns Response with venues data
     */
    getAllVenues: async (req: Request, res: Response): Promise<any> => {
        try {
            const venues = await VenueService.getAllVenues();
            const response: ApiResponse<Venue[]> = {
                timestamp: Date.now(),
                success: true,
                data: venues,
                message: "Venues fetched successfully",
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
     * Get a venue by ID.
     * @param req - Request containing the venue ID
     * @param res - Response with venue data
     * @returns Response with venue data or error
     */
    getVenueById: async (req: Request, res: Response): Promise<any> => {
        try {
            const venueId = req.params.venueId;
            const venue = await VenueService.getVenueById(venueId);

            if (!venue) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: "Venue not found",
                };
                return res.status(404).json(response);
            }

            const response: ApiResponse<Venue> = {
                timestamp: Date.now(),
                success: true,
                data: venue,
                message: "Venue fetched successfully",
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
     * Update venue details.
     * @param req - Request containing venue ID and data to update
     * @param res - Response to send the updated venue or error
     * @returns Response with updated venue or error
     */
    updateVenue: async (req: Request, res: Response): Promise<any> => {
        try {
            const venueId = req.params.venueId;
            const venueData = req.body;

            const result = await VenueService.updateVenue(venueId, venueData);

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

            const response: ApiResponse<Venue> = {
                timestamp: Date.now(),
                success: true,
                data: result as Venue,
                message: "Venue updated successfully",
                error: "",
            };

            logger.info("Venue updated successfully");
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
     * Delete a venue.
     * @param req - Request containing venue ID
     * @param res - Response with success or error
     * @returns Response with success or error
     */
    deleteVenue: async (req: Request, res: Response): Promise<any> => {
        try {
            const venueId = req.params.venueId;
            const result = await VenueService.deleteVenue(venueId);

            if (!result.success) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: result.error || "Error deleting venue",
                };
                return res.status(400).json(response);
            }

            const response: ApiResponse<null> = {
                timestamp: Date.now(),
                success: true,
                data: null,
                message: "Venue deleted successfully",
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
   * Search and filter venues with server-side pagination.
   * @param req - Request containing query parameters for filters and pagination
   * @param res - Response to send the paginated results
   * @returns Response with paginated venues and availability status
   */
    searchVenues: async (req: Request, res: Response): Promise<any> => {
        try {
            const { budget, location, capacity, startDate, endDate, page = 1, limit = 10 } = req.query;

            const result = await VenueService.searchVenues(
                {
                    budget: budget ? parseInt(budget as string, 10) : undefined,
                    capacity: capacity ? parseInt(capacity as string, 10) : undefined,
                    startDate: startDate as string,
                    endDate: endDate as string,
                    location: location as string,
                },
                parseInt(page as string, 10),
                parseInt(limit as string, 10)
            );

            const response: ApiResponse<typeof result> = {
                timestamp: Date.now(),
                success: true,
                data: result,
                message: "Venues fetched successfully",
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
    * Create a new venue booking.
    * @param req - Request containing booking details
    * @param res - Response to send the created booking or error
    * @returns Response with booking or error
    */
    createBooking: async (req: Request, res: Response): Promise<any> => {
        try {
            const venueId = req.params.venueId;
            const {
                eventName,
                eventDescription,
                eventCategory,
                eventType,
                startDate,
                endDate,
                guests,
                services
            } = req.body;

            if (!req.user) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: "User information is missing",
                };
                return res.status(400).json(response);
            }
            const userId = req.user.id;

            // Parse incoming data
            const parsedStartDate = new Date(startDate);
            const parsedEndDate = new Date(endDate);
            const parsedGuests = parseInt(guests);
            const parsedServices = typeof services === 'string' ? JSON.parse(services) : services;
            const isPublic = eventType === 'public';

            if (!parsedServices || typeof parsedServices !== "object" || !("catering" in parsedServices) || !("decoration" in parsedServices) || !("photography" in parsedServices) || !("music" in parsedServices)) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: "Services must include catering, decoration, photography, and music",
                };
                return res.status(400).json(response);
            }

            const image = req.file;

            let imageUrl = undefined;
            if (image) {
                imageUrl = path.join(__dirname, "../public/uploads", image.filename);
            }

            // Calculate total cost
            const venue = await VenueService.getVenueById(venueId);
            if (!venue) {
                const response: ApiResponse<null> = {
                    timestamp: Date.now(),
                    success: false,
                    data: null,
                    message: "",
                    error: "Venue not found",
                };
                return res.status(404).json(response);
            }

            const days = Math.ceil(
                (parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;
            const venueCost = days * venue.pricePerDay;

            // Map service tiers to numeric costs
            const serviceCosts = {
                catering: mapServiceToValue(parsedServices.catering, "catering"),
                decoration: mapServiceToValue(parsedServices.decoration, "decoration"),
                photography: mapServiceToValue(parsedServices.photography, "photography"),
                music: mapServiceToValue(parsedServices.music, "music"),
            };
            const servicesCost = serviceCosts.catering + serviceCosts.decoration +
                serviceCosts.photography + serviceCosts.music;
            const totalCost = venueCost + servicesCost;

            const result = await VenueService.createBooking({
                venueId,
                userId,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                guests: parsedGuests,
                services: serviceCosts,
                totalCost,
                eventDetails: {
                    name: eventName,
                    description: eventDescription,
                    category: eventCategory,
                    isPublic,
                    imageUrl
                }
            });

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

            const response: ApiResponse<VenueBooking> = {
                timestamp: Date.now(),
                success: true,
                data: result as VenueBooking,
                message: "Venue booking created successfully",
                error: "",
            };

            logger.info("Venue booking created successfully");
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

};

export default VenueController;