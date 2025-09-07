import express from "express"
import { login, logout, signup, refreshToken, getCurrentUser, getSocketToken } from "../controllers/auth.controller.js" // Added getSocketToken import
import { protectRoute } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", logout)

router.post("/refresh-token", refreshToken) // Route for refreshing tokens

router.get("/me", protectRoute, getCurrentUser)

router.get("/socket-token", protectRoute, getSocketToken)

export default router // Export the router to be used in the main server file
