import express from "express"
import { protectRoute, sellerRoute } from "../middleware/auth.middleware.js"
import {
  createCheckoutSession,
  checkoutSuccess,
  handleWebhook,
  cancelSubscription,
} from "../controllers/payment.controller.js"

const router = express.Router()

router.post("/create-checkout-session", protectRoute, sellerRoute, createCheckoutSession)
router.get("/checkout-success", checkoutSuccess)
router.post("/cancel-subscription", protectRoute, sellerRoute, cancelSubscription)

router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook)

export default router
