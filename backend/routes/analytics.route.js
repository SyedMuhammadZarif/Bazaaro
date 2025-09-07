import express from "express"
import { protectRoute, sellerRoute } from "../middleware/auth.middleware.js"
import { getSellerAnalytics, getProductAnalytics, getSubscriptionStatus } from "../controllers/analytics.controller.js"

const router = express.Router()

// All analytics routes require seller authentication
router.use(protectRoute, sellerRoute)

// Get seller dashboard analytics
router.get("/dashboard", getSellerAnalytics)

// Get detailed product analytics
router.get("/product/:productId", getProductAnalytics)

// Get subscription status
router.get("/subscription", getSubscriptionStatus)

export default router
