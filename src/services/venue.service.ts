import { PaymentStatus, Prisma, Venue, VenueBooking } from "@prisma/client";
import axios from "axios";
import cloudinary from "../config/cloudinary.config";
import prisma from "../config/prisma.config";
import { isValidDate } from "../utils/date.util";
import { calculateDistance } from "../utils/other.util";
import { mapServiceToValue } from "../utils/service-tier.util";

const simulatePayment = async (amount: number): Promise<boolean> => {
    console.log(`Processing payment of $${amount}...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
};

/**
 * Geocode a location string into latitude and longitude using OpenCage.
 * @param location - Location string (e.g., "Frauenplan 1, 99423 Weimar, Germany")
 * @returns Object with latitude and longitude or null if geocoding fails
 */
const geocodeLocation = async (location: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
        const response = await axios.get(process.env.GEOCODING_API_URL, {
            params: {
                q: location,
                key: process.env.GEOCODING_API_KEY,
            },
        });

        if (response.data.results.length > 0) {
            const { lat, lng } = response.data.results[0].geometry;
            return { latitude: lat, longitude: lng };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};

export const VenueService = {
    /**
     * Create a new venue.
     * @param name - Venue name
     * @param location - Venue location
     * @param capacity - Venue capacity
     * @param pricePerHour - Price per hour for the venue
     * @param description - Venue description (optional)
     * @param imageUrl - Image URL for the venue (optional)
     * @returns Object with the created venue or error
     */
    createVenue: async (
        name: string,
        location: string,
        capacity: number,
        pricePerDay: number,
        description?: string,
        imageUrl?: string,
    ): Promise<Venue | { error: string }> => {
        try {
            let uploadedImageUrl = "";

            if (imageUrl) {
                const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
                    folder: "venue_uploads",
                });
                uploadedImageUrl = uploadResponse.secure_url;
            }

            const coordinates = await geocodeLocation(location);
            if (!coordinates) {
                return { error: "Could not geocode the provided location." };
            }

            const { latitude, longitude } = coordinates;

            const newVenue = await prisma.venue.create({
                data: {
                    name,
                    location,
                    capacity,
                    description,
                    image: uploadedImageUrl,
                    pricePerDay,
                    latitude,
                    longitude,
                },
            });

            return newVenue;
        } catch (error) {
            console.error(error);
            return { error: "Error creating venue" };
        }
    },

    /**
     * Get all venues.
     * @returns List of venues
     */
    getAllVenues: async (): Promise<Venue[]> => {
        try {
            return await prisma.venue.findMany();
        } catch (error) {
            throw new Error("Error fetching venues");
        }
    },

    /**
     * Get venue by ID.
     * @param id - Venue ID
     * @returns Venue data
     */
    getVenueById: async (id: string): Promise<Venue | null> => {
        try {
            return await prisma.venue.findUnique({
                where: { id },
            });
        } catch (error) {
            throw new Error("Error fetching venue by ID");
        }
    },

    /**
     * Update venue details.
     * @param id - Venue ID
     * @param data - Venue data to update
     * @returns Updated venue or error
     */
    updateVenue: async (id: string, data: Partial<Venue>): Promise<Venue | { error: string }> => {
        try {
            return await prisma.venue.update({
                where: { id },
                data: {
                    name: data.name,
                    location: data.location,
                    capacity: data.capacity,
                    description: data.description,
                    image: data.image,
                    pricePerDay: data.pricePerDay,
                },
            });
        } catch (error) {
            return { error: "Error updating venue" };
        }
    },

    /**
     * Delete a venue.
     * @param id - Venue ID
     * @returns Success or error
     */
    deleteVenue: async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            await prisma.venue.delete({
                where: { id },
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: "Error deleting venue" };
        }
    },

    /**
 * Check if a venue is available for a given date range.
 * @param venueId - Venue ID
 * @param startDate - Start date of the booking
 * @param endDate - End date of the booking
 * @returns Boolean indicating availability
 */
    checkAvailability: async (
        venueId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<boolean> => {
        try {
            if (!isValidDate(startDate) || !isValidDate(endDate)) {
                throw new Error("Invalid date format");
            }

            const overlappingBookings = await prisma.venueBooking.findMany({
                where: {
                    venueId,
                    OR: [
                        {
                            startDate: { lte: endDate }, // Changed from lt to lte
                            endDate: { gte: startDate }, // Changed from gt to gte
                        },
                    ],
                },
            });

            console.log(`Checking availability for venue ${venueId} from ${startDate} to ${endDate}`);
            console.log(`Found ${overlappingBookings.length} overlapping bookings:`, overlappingBookings);

            return overlappingBookings.length === 0;
        } catch (error) {
            throw new Error("Error checking venue availability: " + error);
        }
    },

    /**
   * Search and filter venues with server-side pagination.
   * @param filters - Filters for budget, capacity, and date range
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   * @returns Paginated list of venues with availability status
   */
    searchVenues: async (
        filters: {
            budget?: number;
            capacity?: number;
            startDate?: string;
            endDate?: string;
            location?: string;
            radius?: number;
        },
        page: number = 1,
        limit: number = 10
    ) => {
        try {
            const { budget, capacity, startDate, endDate, location, radius = 10 } = filters;

            const where: Prisma.VenueWhereInput = {};
            if (budget) where.pricePerDay = { lte: budget };
            if (capacity) where.capacity = { gte: capacity };

            let latitude: number | undefined;
            let longitude: number | undefined;

            if (location) {
                const coordinates = await geocodeLocation(location);
                if (coordinates) {
                    latitude = coordinates.latitude;
                    longitude = coordinates.longitude;
                } else {
                    throw new Error("Could not geocode the provided location.");
                }
            }

            if (latitude && longitude) {
                const earthRadiusKm = 6371;
                const maxDistance = radius;

                const latRange = (maxDistance / earthRadiusKm) * (180 / Math.PI);
                const lngRange = (maxDistance / earthRadiusKm) * (180 / Math.PI) / Math.cos((latitude * Math.PI) / 180);

                where.AND = [
                    {
                        latitude: {
                            gte: latitude - latRange,
                            lte: latitude + latRange,
                        },
                    },
                    {
                        longitude: {
                            gte: longitude - lngRange,
                            lte: longitude + lngRange,
                        },
                    },
                ];
            }

            const venues = await prisma.venue.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
            });

            const venuesWithinRadius = venues.filter((venue) => {
                if (!latitude || !longitude || !venue.latitude || !venue.longitude) return false;

                const distance = calculateDistance(
                    latitude,
                    longitude,
                    venue.latitude,
                    venue.longitude
                );

                return distance <= radius;
            });

            const venuesWithAvailability = await Promise.all(
                venuesWithinRadius.map(async (venue) => {
                    let isAvailable = true;
                    if (startDate && endDate) {
                        isAvailable = await VenueService.checkAvailability(
                            venue.id,
                            new Date(startDate),
                            new Date(endDate)
                        );
                    }
                    return {
                        ...venue,
                        isAvailable,
                    };
                })
            );

            const total = await prisma.venue.count({ where });

            return {
                venues: venuesWithAvailability,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            throw new Error("Error searching venues: " + error);
        }
    },

    /**
 * Create a new booking for a venue.
 * @param params - Booking parameters including event details
 * @returns Object with the created booking or error
 */
    createBooking: async (params: {
        venueId: string;
        userId: string;
        startDate: Date;
        endDate: Date;
        guests: number;
        services: { catering: number; decoration: number; photography: number; music: number };
        totalCost: number;
        eventDetails: {
            name: string;
            description?: string;
            category: string;
            isPublic: boolean;
            imageUrl?: string;
        };
    }): Promise<VenueBooking | { error: string }> => {
        try {
            const {
                venueId,
                userId,
                startDate,
                endDate,
                guests,
                services,
                totalCost,
                eventDetails
            } = params;

            let uploadedImageUrl = "";

            if (eventDetails.imageUrl) {
                const uploadResponse = await cloudinary.uploader.upload(eventDetails.imageUrl, {
                    folder: "venue_uploads",
                });
                uploadedImageUrl = uploadResponse.secure_url;
            }

            // Validate totalCost is a valid number
            const parsedTotalCost = Number(totalCost);
            if (isNaN(parsedTotalCost) || !Number.isFinite(parsedTotalCost)) {
                return { error: "Invalid totalCost provided. It must be a valid number." };
            }

            if (!services || typeof services !== "object" || !("catering" in services) || !("decoration" in services) || !("photography" in services) || !("music" in services)) {
                return { error: "Services must include catering, decoration, photography, and music" };
            }

            // Check venue availability
            const isAvailable = await VenueService.checkAvailability(venueId, startDate, endDate);
            if (!isAvailable) {
                return { error: "Venue is not available for the selected time slot" };
            }

            // Get venue details
            const venue = await prisma.venue.findUnique({ where: { id: venueId } });
            if (!venue) {
                return { error: "Venue not found" };
            }

            // Simulate payment
            const paymentSuccessful = await simulatePayment(parsedTotalCost);
            if (!paymentSuccessful) {
                return { error: "Payment failed. Booking not created." };
            }

            // Create the event
            const event = await prisma.event.create({
                data: {
                    title: eventDetails.name,
                    description: eventDetails.description || `Event hosted at ${venue.name}`,
                    category: eventDetails.category,
                    date: startDate,
                    isPublic: eventDetails.isPublic,
                    organizerId: userId,
                    venueId: venueId,
                    image: uploadedImageUrl || null
                }
            });

            // Create the booking
            const booking = await prisma.venueBooking.create({
                data: {
                    userId,
                    venueId,
                    eventId: event.id,
                    startDate,
                    endDate,
                    services,
                    guests,
                    totalCost: parsedTotalCost,
                    status: "CONFIRMED"
                },
                include: {
                    event: true,
                    venue: true
                }
            });

            // Create payment record
            await prisma.payment.create({
                data: {
                    userId,
                    amount: parsedTotalCost,
                    status: PaymentStatus.COMPLETED,
                    paymentMethod: "CREDIT_CARD",
                    bookingId: booking.id
                }
            });

            return booking;
        } catch (error) {
            console.error("Error creating booking:", error);
            return { error: `Error creating booking.` };
        }
    }


};