import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Business from "../models/Business.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";

const getCustomer = (ownerClerkId) => Customer.findOne({ ownerClerkId });

// Browse businesses (with search and filters)
export const browseBusiness = async (req, res) => {
  try {
    console.log("🔍 browseBusiness called");
    console.log("🔍 Query:", req.query);
    
    const { 
      search, 
      category, 
      city, 
      state, 
      page = 1, 
      limit = 12 
    } = req.query;
    
    const filter = {};
    
    // Search by agency/business name or description
    if (search) {
      filter.$or = [
        { agencyName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Filter by location
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }
    if (state) {
      filter['address.state'] = { $regex: state, $options: 'i' };
    }
    
    console.log("🔍 Filter:", filter);
    
    const businesses = await Business.find(filter)
      .select('agencyName businessName description category address email phone website imageUrl licenseNumber createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Business.countDocuments(filter);
    
    console.log("🔍 Found businesses:", businesses.length);
    
    res.json({
      success: true,
      businesses,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error("browseBusiness error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get business/agency details with travel packages
export const getBusinessDetails = async (req, res) => {
  try {
    // Handle both businessId and agencyId parameter names
    const id = req.params.businessId || req.params.agencyId;
    console.log("🔍 getBusinessDetails called for ID:", id);
    
    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ message: "Travel agency not found" });
    }
    
    // Get travel packages for this agency
    const services = await Service.find({ 
      business: business._id, 
      isActive: true 
    }).sort({ category: 1, packageName: 1, name: 1 });
    
    // Return with multiple field names for compatibility
    res.json({ 
      success: true, 
      business,
      agency: business, // Alias for frontend compatibility
      services,
      packages: services // Alias for frontend compatibility
    });
  } catch (err) {
    console.error("getBusinessDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Book appointment (supports both traditional appointments and travel bookings)
export const bookAppointment = async (req, res) => {
  try {
    console.log("🔍 bookAppointment called");
    console.log("🔍 Body:", req.body);
    
    // Support both appointment and travel booking field names
    const {
      businessId,
      agencyId,
      serviceId,
      packageId,
      appointmentDate,
      departureDate,
      startTime,
      notes,
      customerNotes,
      numberOfTravelers,
      travelers,
      promoCode,
      subtotal,
      discount,
      totalAmount
    } = req.body;
    
    // Use agencyId/packageId if provided, otherwise businessId/serviceId
    const finalBusinessId = agencyId || businessId;
    const finalServiceId = packageId || serviceId;
    const finalDate = departureDate || appointmentDate;
    const finalNotes = customerNotes || notes || '';
    
    // Validate required fields
    if (!finalBusinessId || !finalServiceId || !finalDate) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: business/agency ID, service/package ID, and date are required" 
      });
    }
    
    // Get user and customer info
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const customer = await Customer.findOne({ ownerClerkId: req.auth.userId });
    
    // Validate business and service
    const business = await Business.findById(finalBusinessId);
    if (!business) {
      return res.status(404).json({ success: false, message: "Business/Agency not found" });
    }
    
    const service = await Service.findOne({ _id: finalServiceId, business: finalBusinessId });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service/Package not found" });
    }
    
    // Determine if this is a travel booking or regular appointment
    const isTravelBooking = numberOfTravelers !== undefined || departureDate !== undefined;
    
    let appointmentData = {
      businessId: finalBusinessId,
      serviceId: finalServiceId,
      customerClerkId: user.clerkId,
      appointmentDate: new Date(finalDate),
      customerName: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : user.name || user.email,
      customerEmail: user.email,
      customerPhone: customer?.phone,
      notes: finalNotes,
      status: 'pending'
    };
    
    if (isTravelBooking) {
      // Travel booking specific fields
      appointmentData.numberOfTravelers = numberOfTravelers || 1;
      appointmentData.travelers = travelers || [];
      appointmentData.promoCode = promoCode || '';
      appointmentData.totalPrice = totalAmount || service.price;
      appointmentData.subtotal = subtotal || service.price;
      appointmentData.discount = discount || 0;
    } else {
      // Regular appointment specific fields
      if (!startTime) {
        return res.status(400).json({ 
          success: false,
          message: "Start time is required for appointments" 
        });
      }
      
      // Calculate end time based on service duration
      const startDateTime = new Date(`2000-01-01T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (service.durationMinutes || 60) * 60000);
      const endTime = endDateTime.toTimeString().slice(0, 5);

      // Check for time conflicts
      const existingAppointment = await Appointment.findOne({
        businessId: finalBusinessId,
        appointmentDate: new Date(finalDate),
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ],
        status: { $in: ['pending', 'confirmed', 'in-progress'] }
      });
      
      if (existingAppointment) {
        return res.status(400).json({ success: false, message: "Time slot is already booked" });
      }
      
      appointmentData.startTime = startTime;
      appointmentData.endTime = endTime;
      appointmentData.totalPrice = service.price;
    }
    
    const appointment = await Appointment.create(appointmentData);
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('serviceId', 'name packageName category durationMinutes durationDays price destination')
      .populate('businessId', 'name agencyName address phone email');
    
    // Update customer stats if customer profile exists
    if (customer) {
      await Customer.findOneAndUpdate(
        { ownerClerkId: user.clerkId },
        { 
          $inc: { totalBookings: 1 },
          $set: { lastLoginAt: new Date() }
        }
      );
    }
    
    console.log("✅ Created booking:", populatedAppointment);
    
    res.status(201).json({ 
      success: true, 
      appointment: populatedAppointment,
      booking: populatedAppointment, // Alias for travel bookings
      message: isTravelBooking ? "Travel package booked successfully" : "Appointment booked successfully"
    });
  } catch (err) {
    console.error("bookAppointment error:", err);
    res.status(400).json({ message: "Error booking appointment", details: err.message });
  }
};

// Get customer's appointments
export const getMyAppointments = async (req, res) => {
  try {
    console.log("🔍 getMyAppointments (customer) called");
    
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter = { customerClerkId: req.auth.userId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const appointments = await Appointment.find(filter)
      .populate('serviceId', 'name category destination images durationDays durationMinutes price')
      .populate('businessId', 'agencyName businessName address imageUrl phone email')
      .sort({ appointmentDate: -1, startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

      console.log(appointments)
      
    const total = await Appointment.countDocuments(filter);
    
    res.json({
      success: true,
      appointments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error("getMyAppointments (customer) error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel appointment (customer side)
export const cancelAppointment = async (req, res) => {
  try {
    console.log("🔍 cancelAppointment (customer) called for ID:", req.params.appointmentId);
    
    const { reason } = req.body;
    
    const appointment = await Appointment.findOneAndUpdate(
      { 
        _id: req.params.appointmentId, 
        customerClerkId: req.auth.userId,
        status: { $in: ['pending', 'confirmed'] }
      },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: 'customer',
          cancellationReason: reason || 'Cancelled by customer'
        }
      },
      { new: true }
    ).populate('serviceId', 'name category images durationMinutes price')
     .populate('businessId', 'name imageUrl address phone email');
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or cannot be cancelled" });
    }
    
    res.json({ 
      success: true, 
      appointment,
      message: "Appointment cancelled successfully"
    });
  } catch (err) {
    console.error("cancelAppointment (customer) error:", err);
    res.status(400).json({ message: "Error cancelling appointment", details: err.message });
  }
};