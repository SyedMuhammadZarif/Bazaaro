import express from "express"
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js"
import {
  getPlatformAnalytics,
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
  getAllProductsForModeration,
  deleteProductAdmin,
  toggleProductFlag,
  getRecentActivity,
} from "../controllers/admin.controller.js"

const router = express.Router()

// All admin routes require admin authentication
router.use(protectRoute, adminRoute)

// Platform analytics
router.get("/analytics", getPlatformAnalytics)
router.get("/activity", getRecentActivity)

// User management
router.get("/users", getAllUsers)
router.put("/users/:userId/ban", banUser)
router.put("/users/:userId/unban", unbanUser)
router.delete("/users/:userId", deleteUser)

// Content moderation
router.get("/products", getAllProductsForModeration)
router.delete("/products/:productId", deleteProductAdmin)
router.put("/products/:productId/flag", toggleProductFlag)

export default router
