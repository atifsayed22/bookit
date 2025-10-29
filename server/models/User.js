import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    imageUrl: { type: String },
    role: { 
      type: String, 
      enum: ["customer", "business", "admin"], 
      default: undefined // null means role not selected yet
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
