import mongoose from "mongoose";

// Unified booking schema for both traditional appointments and travel bookings
const appointmentSchema = new mongoose.Schema(
  {
    // References (support both naming conventions)
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" }, // Alias for businessId
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" }, // Alias for serviceId
    customerClerkId: { type: String, required: true, index: true },
    
    // Date/Time (flexible for both appointment times and travel dates)
    appointmentDate: { type: Date, required: true, index: true },
    departureDate: { type: Date, index: true }, // Alias for appointmentDate (travel bookings)
    returnDate: Date, // For travel bookings
    startTime: String, // For traditional appointments (HH:MM format)
    endTime: String, // For traditional appointments (HH:MM format)
    
    // Travel-specific fields
    numberOfTravelers: { type: Number, min: 1, default: 1 },
    
    // Traveler Information
    travelers: [{
        name: { type: String, required: true },
        age: Number,
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        passportNumber: String,
        nationality: String,
        dietaryRestrictions: String,
        medicalConditions: String
    }],
    
    // Status Management
    status: {
      type: String,
      enum: ["pending", "confirmed","cancelled"],
      default: "pending",
      index: true
    },
    
    // Customer Info (denormalized for easy access)
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: String,
    
    // Pricing Details
    basePrice: Number,
    subtotal: Number, // For travel bookings with promo codes
    promoCode: String,
    discount: { type: Number, default: 0 }, // Discount amount
    discountAmount: { type: Number, default: 0 }, // Alias for discount
    totalPrice: { type: Number, required: true },
    
    // Additional Details
    notes: String, // Customer notes
    specialRequests: String, // Customer special requests (alias)
    agencyNotes: String, // Internal agency/business notes
    
    // Payment Information
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded", "partial"],
        default: "pending"
    },
    paymentMethod: String,
    transactionId: String,
    
    // Cancellation tracking
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ["customer", "business", "agency", "system"] },
    cancellationReason: String,
    refundAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
appointmentSchema.index({ businessId: 1, appointmentDate: 1 });
appointmentSchema.index({ businessId: 1, status: 1 });
appointmentSchema.index({ customerClerkId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

export default mongoose.model("Appointment", appointmentSchema);