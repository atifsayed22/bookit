import Business from "../models/Business.js";
import Service from "../models/Service.js";

const getOwnerBusiness = (ownerClerkId) => Business.findOne({ ownerClerkId });

export const getMyServices = async (req, res) => {
  try {
    console.log("🔍 getMyServices called - auth:", req.auth);
    console.log("🔍 userId:", req.auth?.userId);
    
    if (!req.auth?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const business = await getOwnerBusiness(req.auth.userId);
    console.log("🔍 Found business:", business ? business._id : 'No business');
    
    if (!business) return res.json({ services: [] });
    
    const services = await Service.find({ business: business._id }).sort({ createdAt: -1 });
    console.log("🔍 Found services:", services.length);
    
    res.json({ services });
  } catch (err) {
    console.error("getMyServices error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createService = async (req, res) => {
  try {
    console.log("🔍 createService called - auth:", req.auth?.userId);
    console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));
    
    const business = await getOwnerBusiness(req.auth.userId);
    console.log("🔍 Found business:", business ? business._id : 'No business');
    
    if (!business) return res.status(400).json({ message: "Create business profile first" });

    const {
      packageName,
      destination,
      durationDays,
      price,
      description = "",
      category = "Adventure",
      inclusions = [],
      exclusions = [],
      maxGroupSize = 10,
      minAge = 0,
      difficulty = "Easy",
      images = [],
      isActive = true,
    } = req.body;

    console.log("🔍 Extracted fields:", { packageName, destination, durationDays, price, category });

    if (!packageName || !destination || !durationDays || price === undefined) {
      console.log("❌ Missing required fields:", { 
        packageName: !!packageName, 
        destination: !!destination, 
        durationDays: !!durationDays, 
        price: price !== undefined 
      });
      return res.status(400).json({ 
        message: "packageName, destination, durationDays, and price are required",
        received: { packageName, destination, durationDays, price }
      });
    }

    const serviceData = {
      business: business._id,
      packageName,
      destination,
      description,
      durationDays: parseInt(durationDays),
      price: parseFloat(price),
      category,
      inclusions: Array.isArray(inclusions) ? inclusions : [],
      exclusions: Array.isArray(exclusions) ? exclusions : [],
      maxGroupSize: parseInt(maxGroupSize) || 10,
      minAge: parseInt(minAge) || 0,
      difficulty,
      images: Array.isArray(images) ? images : [],
      isActive: Boolean(isActive),
    };

    console.log("🔍 Creating service with data:", JSON.stringify(serviceData, null, 2));

    const service = await Service.create(serviceData);

    res.status(201).json({ service });
  } catch (err) {
    console.error("createService error:", err);
    res.status(400).json({ message: "Validation error", details: err.message });
  }
};

export const updateService = async (req, res) => {
  try {
    console.log("🔍 updateService called for ID:", req.params.id);
    console.log("🔍 Update body:", JSON.stringify(req.body, null, 2));
    
    const business = await getOwnerBusiness(req.auth.userId);
    if (!business) return res.status(400).json({ message: "Create business profile first" });

    const updates = { ...req.body };
    
    // Handle field type conversions
    if (updates.durationDays) {
      updates.durationDays = parseInt(updates.durationDays);
    }
    
    if (updates.price) {
      updates.price = parseFloat(updates.price);
    }

    if (updates.maxGroupSize) {
      updates.maxGroupSize = parseInt(updates.maxGroupSize);
    }

    if (updates.minAge) {
      updates.minAge = parseInt(updates.minAge);
    }

    // Ensure arrays
    if (updates.inclusions && !Array.isArray(updates.inclusions)) {
      updates.inclusions = [];
    }

    if (updates.exclusions && !Array.isArray(updates.exclusions)) {
      updates.exclusions = [];
    }

    if (updates.images && !Array.isArray(updates.images)) {
      updates.images = [];
    }

    console.log("🔍 Final updates:", JSON.stringify(updates, null, 2));

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, business: business._id },
      { $set: updates },
      { new: true }
    );

    if (!service) return res.status(404).json({ message: "Service not found" });
    
    console.log("✅ Service updated successfully");
    res.json({ service });
  } catch (err) {
    console.error("updateService error:", err);
    res.status(400).json({ message: "Validation error", details: err.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const business = await getOwnerBusiness(req.auth.userId);
    if (!business) return res.status(400).json({ message: "Create business profile first" });

    const result = await Service.findOneAndDelete({ _id: req.params.id, business: business._id });
    if (!result) return res.status(404).json({ message: "Service not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("deleteService error:", err);
    res.status(500).json({ message: "Server error" });
  }
};