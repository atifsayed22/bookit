import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import {
  browseBusiness,
  getBusinessDetails,
  bookAppointment,
  getMyAppointments,
  cancelAppointment
} from "../controllers/customerController.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(ClerkExpressRequireAuth());

// Business/Agency search and discovery
router.get("/businesses/search", browseBusiness);

// Travel Agency routes (support both /businesses and /agencies)
router.get("/agencies/:agencyId", getBusinessDetails);
router.get("/businesses/:businessId", getBusinessDetails);

// Appointment/Booking management
router.post("/appointments", bookAppointment);
router.get("/appointments", getMyAppointments);
router.patch("/appointments/:appointmentId/cancel", cancelAppointment);

// Travel Booking routes (aliases for appointments)
router.post("/travel-bookings", bookAppointment);
router.get("/bookings", getMyAppointments);

export default router;