import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getMyAppointments,
  updateAppointmentStatus,
  getAppointmentDetails,
} from "../controllers/appointmentController.js";

const router = Router();

router.use(requireAuth);

// Business appointment management routes
router.get("/my-appointments", getMyAppointments);
router.get("/:id", getAppointmentDetails);
router.put("/:id/status", updateAppointmentStatus);

export default router;