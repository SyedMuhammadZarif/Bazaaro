import User from "../models/user.model.js"
import Product from "../models/product.model.js"
import { Chat } from "../models/chat.model.js"
import Plan from "../models/plan.model.js"
import { redis } from "../lib/redis.js"

// Get platform analytics for admin dashboard
export const getPlatformAnalytics = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ status: "active" })
    const bannedUsers = await User.countDocuments({ status: "banned" })
    const sellers = await User.countDocuments({ role: "seller" })
    const buyers = await User.countDocuments({ role: "buyer" })

    // Product statistics
    const totalProducts = await Product.countDocuments()
    const featuredProducts = await Product.countDocuments({ isFeatured: true })

    // Chat statistics
    const totalChats = await Chat.countDocuments()
    const activeChats = await Chat.countDocuments({
      isActive: true,
      lastMessage: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })

    // Subscription statistics
    const activeSubscriptions = await Plan.countDocuments({
      isActive: true,
      endDate: { $gte: new Date() },
    })

    // Recent user registrations (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    })

    // User growth trends (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    // Top sellers by product count
    const topSellers = await Product.aggregate([
      {
        $group: {
          _id: "$owner",
          productCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "seller",
        },
      },
      {
        $unwind: "$seller",
      },
      {
        $sort: { productCount: -1 },
      },
      {
        $limit: 10,
      },
    ])

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        bannedUsers,
        sellers,
        buyers,
        totalProducts,
        featuredProducts,
        totalChats,
        activeChats,
        activeSubscriptions,
        recentRegistrations,
      },
      userGrowth,
      topSellers,
    })
  } catch (error) {
    console.error("Error fetching platform analytics:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get all users with pagination and filtering
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query

    const query = {}
    if (role) query.role = role
    if (status) query.status = status
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    const users = await User.find(query)
      .select("-password")
      .populate("bannedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Ban a user
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { reason } = req.body
    const adminId = req.user._id

    if (userId === adminId.toString()) {
      return res.status(400).json({ message: "Cannot ban yourself" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot ban admin users" })
    }

    user.status = "banned"
    user.bannedAt = new Date()
    user.bannedBy = adminId
    user.banReason = reason || "Violation of platform terms"
    await user.save()

    // Clear user sessions from Redis
    await redis.del(`user:${userId}:session`)

    res.json({ message: "User banned successfully", user: { ...user.toJSON(), password: undefined } })
  } catch (error) {
    console.error("Error banning user:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Unban a user
export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.status = "active"
    user.bannedAt = null
    user.bannedBy = null
    user.banReason = null
    await user.save()

    res.json({ message: "User unbanned successfully", user: { ...user.toJSON(), password: undefined } })
  } catch (error) {
    console.error("Error unbanning user:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Delete a user account
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params
    const adminId = req.user._id

    if (userId === adminId.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin users" })
    }

    // Delete user's products if they're a seller
    if (user.role === "seller") {
      await Product.deleteMany({ owner: userId })
    }

    // Delete user's chats
    await Chat.deleteMany({ participants: userId })

    // Delete user's plans
    await Plan.deleteMany({ user: userId })

    // Delete the user
    await User.findByIdAndDelete(userId)

    // Clear user sessions from Redis
    await redis.del(`user:${userId}:session`)

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get all products for moderation
export const getAllProductsForModeration = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, flagged } = req.query

    const query = {}
    if (category) query.category = category
    if (flagged === "true") query.isFlagged = true
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const products = await Product.find(query)
      .populate("owner", "name email role status")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Product.countDocuments(query)

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Error fetching products for moderation:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Delete a product (admin moderation)
export const deleteProductAdmin = async (req, res) => {
  try {
    const { productId } = req.params
    const { reason } = req.body

    const product = await Product.findById(productId).populate("owner", "name email")
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // TODO: Send notification to seller about product removal
    console.log(`Product "${product.name}" removed by admin. Reason: ${reason || "Policy violation"}`)

    await Product.findByIdAndDelete(productId)

    // Clear featured products cache
    await redis.del("featured_products")

    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Flag/unflag a product
export const toggleProductFlag = async (req, res) => {
  try {
    const { productId } = req.params
    const { reason } = req.body

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    product.isFlagged = !product.isFlagged
    product.flagReason = product.isFlagged ? reason || "Content review required" : null
    product.flaggedAt = product.isFlagged ? new Date() : null
    product.flaggedBy = product.isFlagged ? req.user._id : null

    await product.save()

    res.json({
      message: product.isFlagged ? "Product flagged successfully" : "Product unflagged successfully",
      product,
    })
  } catch (error) {
    console.error("Error toggling product flag:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get recent platform activity
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 50 } = req.query

    // Recent user registrations
    const recentUsers = await User.find().select("name email role createdAt").sort({ createdAt: -1 }).limit(10)

    // Recent products
    const recentProducts = await Product.find()
      .populate("owner", "name email")
      .select("name owner createdAt")
      .sort({ createdAt: -1 })
      .limit(10)

    // Recent chats
    const recentChats = await Chat.find()
      .populate("participants", "name email")
      .select("participants createdAt chatType")
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      recentUsers,
      recentProducts,
      recentChats,
    })
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
