import express from "express"
import { protectRoute } from "../middleware/auth.middleware.js"
import { getUserProfile, updateProfile, getSellerStore, changePassword } from "../controllers/profile.controller.js"

const router = express.Router()

router.get("/:userId", getUserProfile) // Get user profile by ID
router.put("/update", protectRoute, updateProfile) // Update own profile
router.get("/store/:sellerId", getSellerStore) // Get seller store page
router.put("/change-password", protectRoute, changePassword) // Change password

export default router
