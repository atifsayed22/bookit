import Business from "../models/Business.js";

export const getMyBusinessProfile = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerClerkId: req.auth.userId });
    return res.json({ business: business || null });
  } catch (err) {
    console.error("getMyBusinessProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createMyBusinessProfile = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;
    console.log("🔍 Auth object:", req.auth);
    console.log("🔍 OwnerClerkId:", ownerClerkId);
    console.log("🔍 Request body:", req.body);
    
    if (!ownerClerkId) {
      return res.status(401).json({ message: "Authentication required - no userId found" });
    }

    const exists = await Business.findOne({ ownerClerkId });
    if (exists) return res.status(409).json({ message: "Business already exists" });

    const business = await Business.create({ ...req.body, ownerClerkId });
    res.status(201).json({ business });
  } catch (err) {
    console.error("createMyBusinessProfile error:", err);
    res.status(400).json({ message: "Validation error", details: err.message });
  }
};

export const updateMyBusinessProfile = async (req, res) => {
  try {
    const business = await Business.findOneAndUpdate(
      { ownerClerkId: req.auth.userId },
      { $set: req.body },
      { new: true }
    );
    if (!business) return res.status(404).json({ message: "Business not found" });
    res.json({ business });
  } catch (err) {
    console.error("updateMyBusinessProfile error:", err);
    res.status(400).json({ message: "Validation error", details: err.message });
  }
};