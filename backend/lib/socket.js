import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import { Chat } from "../models/chat.model.js"
import { redis } from "./redis.js"

const connectedUsers = new Map()

export const setupSocketHandlers = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error("Authentication error"))
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decoded.userId).select("-password")

      if (!user) {
        return next(new Error("User not found"))
      }

      socket.userId = user._id.toString()
      socket.user = user
      next()
    } catch (error) {
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.name} connected`)

    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date(),
    })

    // Join user to their personal room
    socket.join(`user:${socket.userId}`)

    // Emit online status to contacts
    socket.broadcast.emit("user_online", {
      userId: socket.userId,
      user: {
        _id: socket.user._id,
        name: socket.user.name,
        avatar: socket.user.avatar,
      },
    })

    // Handle joining chat rooms
    socket.on("join_chat", async (chatId) => {
      try {
        const chat = await Chat.findById(chatId)
        if (chat && chat.participants.some((p) => p.toString() === socket.userId)) {
          socket.join(`chat:${chatId}`)
          console.log(`User ${socket.user.name} joined chat ${chatId}`)
        }
      } catch (error) {
        console.error("Error joining chat:", error)
      }
    })

    // Handle leaving chat rooms
    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat:${chatId}`)
      console.log(`User ${socket.user.name} left chat ${chatId}`)
    })

    // Handle sending messages
    socket.on("send_message", async (data) => {
      try {
        const { chatId, content, messageType = "text", productRef, imageUrl } = data

        const chat = await Chat.findById(chatId)
        if (!chat || !chat.participants.some((p) => p.toString() === socket.userId)) {
          return socket.emit("error", { message: "Chat not found" })
        }

        const newMessage = {
          sender: socket.userId,
          content,
          messageType,
          productRef: messageType === "product" ? productRef : undefined,
          imageUrl: messageType === "image" ? imageUrl : undefined,
          createdAt: new Date(),
        }

        chat.messages.push(newMessage)
        chat.lastMessage = new Date()
        await chat.save()

        // Populate the message
        await chat.populate("messages.sender", "name avatar")
        if (messageType === "product") {
          await chat.populate("messages.productRef", "name images price")
        }

        const populatedMessage = chat.messages[chat.messages.length - 1]

        // Emit to all participants in the chat
        io.to(`chat:${chatId}`).emit("new_message", {
          chatId,
          message: populatedMessage,
        })

        // Send push notification to offline users
        const offlineParticipants = chat.participants.filter(
          (p) => p.toString() !== socket.userId && !connectedUsers.has(p.toString()),
        )

        // Cache message for offline users
        for (const participantId of offlineParticipants) {
          await redis.lpush(
            `user:${participantId}:offline_messages`,
            JSON.stringify({
              chatId,
              message: populatedMessage,
              timestamp: new Date(),
            }),
          )
        }
      } catch (error) {
        console.error("Error sending message:", error)
        socket.emit("error", { message: "Failed to send message" })
      }
    })

    // Handle typing indicators
    socket.on("typing_start", (data) => {
      socket.to(`chat:${data.chatId}`).emit("user_typing", {
        userId: socket.userId,
        user: {
          _id: socket.user._id,
          name: socket.user.name,
        },
        chatId: data.chatId,
      })
    })

    socket.on("typing_stop", (data) => {
      socket.to(`chat:${data.chatId}`).emit("user_stop_typing", {
        userId: socket.userId,
        chatId: data.chatId,
      })
    })

    // Handle message read receipts
    socket.on("mark_messages_read", async (data) => {
      try {
        const { chatId } = data
        const chat = await Chat.findById(chatId)

        if (chat && chat.participants.some((p) => p.toString() === socket.userId)) {
          const unreadMessages = chat.messages.filter(
            (msg) =>
              !msg.readBy.some((read) => read.user.toString() === socket.userId) &&
              msg.sender.toString() !== socket.userId,
          )

          if (unreadMessages.length > 0) {
            unreadMessages.forEach((msg) => {
              msg.readBy.push({ user: socket.userId, readAt: new Date() })
            })
            await chat.save()

            // Notify other participants
            socket.to(`chat:${chatId}`).emit("messages_read", {
              chatId,
              readBy: socket.userId,
              user: {
                _id: socket.user._id,
                name: socket.user.name,
              },
            })
          }
        }
      } catch (error) {
        console.error("Error marking messages as read:", error)
      }
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.user.name} disconnected`)

      // Remove from connected users
      connectedUsers.delete(socket.userId)

      // Emit offline status
      socket.broadcast.emit("user_offline", {
        userId: socket.userId,
        lastSeen: new Date(),
      })
    })
  })

  // Helper function to get online users
  io.getOnlineUsers = () => {
    return Array.from(connectedUsers.values()).map((conn) => ({
      userId: conn.user._id,
      user: {
        _id: conn.user._id,
        name: conn.user.name,
        avatar: conn.user.avatar,
      },
      lastSeen: conn.lastSeen,
    }))
  }
}
