import express from "express"
import {
  getUserChats,
  getOrCreateChat,
  getChatMessages,
  sendMessage,
  deleteChat,
  endChat,
  reportChat,
} from "../controllers/chat.controller.js"
import { protectRoute } from "../middleware/auth.middleware.js"

const router = express.Router()

// All chat routes require authentication
router.use(protectRoute)

// Get all chats for current user
router.get("/", getUserChats)

// Get or create chat between users
router.post("/create", getOrCreateChat)

// Get messages for a specific chat
router.get("/:chatId/messages", getChatMessages)

// Send a message to a chat
router.post("/:chatId/messages", sendMessage)

router.put("/:chatId/end", endChat)

router.post("/:chatId/report", reportChat)

// Delete a chat
router.delete("/:chatId", deleteChat)

export default router
