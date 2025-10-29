import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: { type: String, default: "United States" }
}, { _id: false });

const preferencesSchema = new mongoose.Schema({
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  },
  language: { type: String, default: "en" },
  timezone: String,
  currency: { type: String, default: "USD" }
}, { _id: false });

const customerSchema = new mongoose.Schema(
  {
    ownerClerkId: { type: String, required: true, unique: true, index: true }, // Links to User
    
    // Personal Information
    firstName: String,
    lastName: String,
    phone: String,
    dateOfBirth: Date,
    gender: { 
      type: String, 
      enum: ["male", "female", "other", "prefer_not_to_say"] 
    },
    
    // Address Information
    address: { type: addressSchema, default: () => ({}) },
    
    // Customer Preferences
    preferences: { type: preferencesSchema, default: () => ({}) },
    
    // Customer Statistics
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    favoriteBusinesses: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Business' 
    }],
    
    // Account Status
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: Date,
    
    // Emergency Contact
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  { timestamps: true }
);

// Indexes for efficient customer queries
customerSchema.index({ ownerClerkId: 1 });
customerSchema.index({ "address.city": 1, "address.state": 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ totalBookings: -1 });

export default mongoose.model("Customer", customerSchema);