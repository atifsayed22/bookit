import User from "../models/User.js";


/**
 * Create or Update User with Caching
 * 
 * Learning: Cache-Aside Pattern
 * 1. Check cache first
 * 2. If miss, query database  
 * 3. Update cache with fresh data
 * 4. Return data to client
 */
export const createOrUpdateUser = async (req, res) => {
  try {
    const { clerkId, email, name, imageUrl } = req.body;
    console.log("Clerk ID:", clerkId);
    console.log("Email:", email);

    // Use findOneAndUpdate with upsert to create or update user safely
    const user = await User.findOneAndUpdate(
      { clerkId }, // Query to find user
      { $set: { email, name, imageUrl } }, // Fields to update
      { upsert: true, new: true, setDefaultsOnInsert: true } // Create if not exists, return the updated/new doc
    );

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in createOrUpdateUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get User by Clerk ID with Caching
 * 
 * Learning: Read-Through Cache Pattern
 * 1. Try cache first (fast path)
 * 2. If cache miss, query database (slow path)
 * 3. Cache the result for next time
 * 4. Return data to client
 */
export const getUserByClerkId = async (req, res) => {
  try {
    const { clerkId } = req.params;
    
    // Step 1: Try cache first (microsecond access)

    // Step 2: Cache miss - query database (millisecond access)

    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Step 3: Cache the result for future requests


    // Step 4: Return data
    res.status(200).json({ success: true, user, cached: false });
  } catch (error) {
    console.error("Error in getUserByClerkId:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update User Role with Cache Invalidation
 * 
 * Learning: Write-Through + Cache Invalidation Pattern
 * 1. Validate input
 * 2. Update database
 * 3. Invalidate old cache (important!)
 * 4. Cache new data
 * 5. Return updated data
 */
export const updateUserRole = async (req, res) => {
  try {
    const { clerkId, role } = req.body;

    // Step 1: Validate role input
    if (!["customer", "business", "admin"].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid role. Must be customer, business, or admin" 
      });
    }

    // Step 2: Update database
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = role;
    await user.save();

    // Step 3: Cache invalidation - remove old cached data
    // Learning: Stale cache data can cause bugs, always invalidate on writes
   

    // Step 5: Return updated data
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in updateUserRole:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
