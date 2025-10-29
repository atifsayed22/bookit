import Business from "../models/Business.js";
import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";

const getOwnerBusiness = (ownerClerkId) => Business.findOne({ ownerClerkId });

// Get all appointments for business (with filters)
export const getMyAppointments = async (req, res) => {
  try {
    console.log("🔍 getMyAppointments called - auth:", req.auth);
    console.log("🔍 Query params:", req.query);

    const business = await getOwnerBusiness(req.auth.userId);
    if (!business) {
      console.log("🔍 No business found");
      return res.json({ appointments: [] });
    }

    console.log("🔍 Found business:", business._id);

    // Query filters from request
    const { status, date, page = 1, limit = 50 } = req.query;

    const filter = { businessId: business._id };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    console.log("🔍 Filter:", filter);

    const appointments = await Appointment.find(filter)
      .populate(
        "serviceId",
        "packageName destination price discountPrice durationDays category images"
      )
      .populate("businessId", "name email phone")
      .sort({ appointmentDate: 1, startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(filter);
      console.log("appointments:",appointments)

    res.json({
      success: true,
      appointments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    console.error("getMyAppointments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    console.log("🔍 updateAppointmentStatus called");
    console.log("🔍 Appointment ID:", req.params.id);
    console.log("🔍 Body:", req.body);

    const business = await getOwnerBusiness(req.auth.userId);
    if (!business) {
      return res.status(400).json({ message: "Create business profile first" });
    }

    const { status, businessNotes } = req.body;

    if (
      ![
        "pending",
        "confirmed",
        "cancelled",

      ].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = { status };
    if (businessNotes) updateData.businessNotes = businessNotes;

    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = "business";
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, businessId: business._id },
      { $set: updateData },
      { new: true }
    ).populate("serviceId", "name category durationMinutes price");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    console.log("🔍 Updated appointment:", appointment);
    res.json({ success: true, appointment });
  } catch (err) {
    console.error("updateAppointmentStatus error:", err);
    res
      .status(400)
      .json({ message: "Error updating appointment", details: err.message });
  }
};

// Get appointment details
export const getAppointmentDetails = async (req, res) => {
  try {
    console.log("🔍 getAppointmentDetails called for ID:", req.params.id);

    const business = await getOwnerBusiness(req.auth.userId);
    if (!business) {
      return res.status(400).json({ message: "Create business profile first" });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      businessId: business._id,
    }).populate("serviceId", "name category durationMinutes price");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ success: true, appointment });
  } catch (err) {
    console.error("getAppointmentDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
