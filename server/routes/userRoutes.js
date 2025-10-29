import express from "express";
import { 
  createOrUpdateUser, 
  getUserByClerkId, 
  updateUserRole 
} from "../controllers/userController.js";

const router = express.Router();

router.post("/sync", createOrUpdateUser);
router.get("/:clerkId", getUserByClerkId);
router.put("/role", updateUserRole);

export default router;
