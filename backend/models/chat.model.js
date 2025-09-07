import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  messageType: {
    type: String,
    enum: ["text", "image", "product"],
    default: "text",
  },
  productRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: function () {
      return this.messageType === "product"
    },
  },
  imageUrl: {
    type: String,
    required: function () {
      return this.messageType === "image"
    },
  },
  readBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [messageSchema],
    lastMessage: {
      type: Date,
      default: Date.now,
    },
    chatType: {
      type: String,
      enum: ["direct", "product_inquiry"],
      default: "direct",
    },
    productContext: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["active", "ended", "deleted"],
      default: "active",
    },
    endedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    endedAt: {
      type: Date,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reportReason: {
      type: String,
    },
    reportedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
chatSchema.index({ participants: 1 })
chatSchema.index({ lastMessage: -1 })
chatSchema.index({ "messages.createdAt": -1 })

export const Chat = mongoose.model("Chat", chatSchema)
