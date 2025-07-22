import { Router } from "express";
import EventController from "../controllers/event.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { upload } from "../config/multer.config";

const eventRouter = Router();

eventRouter.post("/", authenticate, authorize(['USER']), upload.single("image"), EventController.createEvent);
eventRouter.get("/", authenticate, EventController.getAllEvents);
eventRouter.get("/public", EventController.getAllPublicEvents);
eventRouter.get("/public/upcoming", authenticate, authorize(['USER']), EventController.getUpcomingPublicEvents);
eventRouter.get("/organizer/:organizerId", authenticate, authorize(['ADMIN', 'USER']), EventController.getEventsByOrganizer);
eventRouter.get("/:eventId", EventController.getEventById);
eventRouter.put("/:eventId", authenticate, EventController.updateEvent);
eventRouter.delete("/:eventId", authenticate, authorize(['ADMIN']), EventController.deleteEvent);

export default eventRouter;
