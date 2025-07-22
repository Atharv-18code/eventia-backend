import { Router } from "express";
import VenueController from "../controllers/venue.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { upload } from "../config/multer.config";

const venueRouter = Router();

venueRouter.post(
    "/",
    authenticate,
    authorize(["ADMIN"]),
    upload.single("image"),
    VenueController.createVenue
);

venueRouter.get("/", VenueController.getAllVenues);

venueRouter.get("/search", VenueController.searchVenues);

venueRouter.get("/:venueId", VenueController.getVenueById);

venueRouter.put(
    "/:venueId",
    authenticate,
    authorize(["ADMIN"]),
    VenueController.updateVenue
);

venueRouter.delete(
    "/:venueId",
    authenticate,
    authorize(["ADMIN"]),
    VenueController.deleteVenue
);

venueRouter.post(
    "/:venueId/book",
    authenticate,
    authorize(["USER"]),
    upload.single("eventImage"),
    VenueController.createBooking
);

export default venueRouter;