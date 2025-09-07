import { Chat } from "../models/chat.model.js"
import { redis } from "../lib/redis.js"

// Get all chats for current user
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id

    const chats = await Chat.find({
      participants: userId,
      isActive: true,
    })
      .populate("participants", "name email avatar userType")
      .populate("productContext", "name images price")
      .sort({ lastMessage: -1 })

    // Get unread message counts
    const chatsWithUnread = chats.map((chat) => {
      const unreadCount = chat.messages.filter(
        (msg) =>
          !msg.readBy.some((read) => read.user.toString() === userId.toString()) &&
          msg.sender.toString() !== userId.toString(),
      ).length

      return {
        ...chat.toJSON(),
        unreadCount,
        lastMessageContent: chat.messages[chat.messages.length - 1]?.content || "",
        lastMessageTime: chat.messages[chat.messages.length - 1]?.createdAt || chat.lastMessage,
      }
    })

    res.json(chatsWithUnread)
  } catch (error) {
    console.error("Error fetching user chats:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get or create chat between two users
export const getOrCreateChat = async (req, res) => {
  try {
    const { participantId, productId } = req.body
    const currentUserId = req.user._id

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, participantId] },
      productContext: productId || null,
    })
      .populate("participants", "name email avatar userType")
      .populate("productContext", "name images price")

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [currentUserId, participantId],
        productContext: productId || null,
        chatType: productId ? "product_inquiry" : "direct",
      })
      await chat.save()

      await chat.populate("participants", "name email avatar userType")
      if (productId) {
        await chat.populate("productContext", "name images price")
      }
    }

    res.json(chat)
  } catch (error) {
    console.error("Error getting or creating chat:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params
    const { page = 1, limit = 50 } = req.query
    const userId = req.user._id

    const chat = await Chat.findById(chatId)
      .populate("participants", "name email avatar userType")
      .populate("messages.sender", "name avatar")
      .populate("messages.productRef", "name images price")

    if (!chat || !chat.participants.some((p) => p._id.toString() === userId.toString())) {
      return res.status(404).json({ message: "Chat not found" })
    }

    // Get paginated messages
    const skip = (page - 1) * limit
    const messages = chat.messages
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(skip, skip + Number.parseInt(limit))
      .reverse()

    // Mark messages as read
    const unreadMessages = chat.messages.filter(
      (msg) =>
        !msg.readBy.some((read) => read.user.toString() === userId.toString()) &&
        msg.sender.toString() !== userId.toString(),
    )

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        msg.readBy.push({ user: userId, readAt: new Date() })
      })
      await chat.save()
    }

    res.json({
      chat: {
        _id: chat._id,
        participants: chat.participants,
        productContext: chat.productContext,
        chatType: chat.chatType,
      },
      messages,
      hasMore: skip + messages.length < chat.messages.length,
    })
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params
    const { content, messageType = "text", productRef, imageUrl } = req.body
    const senderId = req.user._id

    const chat = await Chat.findById(chatId)
    if (!chat || !chat.participants.some((p) => p.toString() === senderId.toString())) {
      return res.status(404).json({ message: "Chat not found" })
    }

    const newMessage = {
      sender: senderId,
      content,
      messageType,
      productRef: messageType === "product" ? productRef : undefined,
      imageUrl: messageType === "image" ? imageUrl : undefined,
      createdAt: new Date(),
    }

    chat.messages.push(newMessage)
    chat.lastMessage = new Date()
    await chat.save()

    // Populate the new message
    await chat.populate("messages.sender", "name avatar")
    if (messageType === "product") {
      await chat.populate("messages.productRef", "name images price")
    }

    const populatedMessage = chat.messages[chat.messages.length - 1]

    // Cache message for real-time delivery
    await redis.lpush(`chat:${chatId}:messages`, JSON.stringify(populatedMessage))
    await redis.ltrim(`chat:${chatId}:messages`, 0, 99) // Keep last 100 messages in cache

    res.json(populatedMessage)
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Delete a chat
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params
    const userId = req.user._id

    const chat = await Chat.findById(chatId)
    if (!chat || !chat.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(404).json({ message: "Chat not found" })
    }

    // Only allow deletion if chat is ended or user is deleting their own copy
    if (chat.status !== "ended") {
      return res.status(400).json({ message: "Chat must be ended before deletion" })
    }

    chat.status = "deleted"
    chat.isActive = false
    await chat.save()

    res.json({ message: "Chat deleted successfully" })
  } catch (error) {
    console.error("Error deleting chat:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// End a chat
export const endChat = async (req, res) => {
  try {
    const { chatId } = req.params
    const userId = req.user._id

    const chat = await Chat.findById(chatId)
    if (!chat || !chat.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(404).json({ message: "Chat not found" })
    }

    if (chat.status === "ended") {
      return res.status(400).json({ message: "Chat is already ended" })
    }

    chat.status = "ended"
    chat.endedBy = userId
    chat.endedAt = new Date()
    await chat.save()

    // Notify other participant via socket
    try {
      await redis.publish(
        `chat:${chatId}:ended`,
        JSON.stringify({
          chatId,
          endedBy: userId,
          endedAt: chat.endedAt,
        }),
      )
    } catch (redisError) {
      console.error("Redis publish error (non-critical):", redisError)
      // Don't fail the request if Redis is down
    }

    res.json({ message: "Chat ended successfully", chat })
  } catch (error) {
    console.error("Error ending chat:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Report a chat
export const reportChat = async (req, res) => {
  try {
    const { chatId } = req.params
    const { reason } = req.body
    const userId = req.user._id

    const chat = await Chat.findById(chatId)
    if (!chat || !chat.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(404).json({ message: "Chat not found" })
    }

    chat.reportedBy = userId
    chat.reportReason = reason
    chat.reportedAt = new Date()
    chat.status = "ended"
    await chat.save()

    res.json({ message: "Chat reported successfully" })
  } catch (error) {
    console.error("Error reporting chat:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
