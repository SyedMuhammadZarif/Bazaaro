import Product from "../models/product.model.js"
import { Chat } from "../models/chat.model.js"
import Plan from "../models/plan.model.js"
import Post from "../models/post.model.js"

// Get seller dashboard analytics
export const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id

    // Get seller's products
    const products = await Product.find({ owner: sellerId })
    const productIds = products.map((p) => p._id)

    // Get seller's active plan
    const activePlan = await Plan.findOne({
      user: sellerId,
      isActive: true,
      endDate: { $gte: new Date() },
    })

    // Get chat statistics
    const totalChats = await Chat.countDocuments({
      participants: sellerId,
      isActive: true,
    })

    const activeChats = await Chat.countDocuments({
      participants: sellerId,
      isActive: true,
      lastMessage: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    })

    // Calculate product engagement metrics
    const totalProducts = products.length
    const featuredProducts = products.filter((p) => p.isFeatured).length

    // Get recent inquiries (chats created in last 30 days)
    const recentInquiries = await Chat.countDocuments({
      participants: sellerId,
      chatType: "product_inquiry",
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })

    // Get post count tracking for analytics
    const totalPosts = await Post.countDocuments({ author: sellerId, isActive: true })

    // Calculate plan usage
    const planUsage = {
      currentProducts: totalProducts,
      maxProducts: 5, // Default free tier
      currentPosts: totalPosts,
      maxPosts: 5, // Default free tier
      planType: "free",
      daysRemaining: null,
    }

    if (activePlan) {
      planUsage.planType = activePlan.planType
      planUsage.maxProducts = activePlan.features.maxProducts
      planUsage.maxPosts = activePlan.features.maxPosts
      planUsage.daysRemaining = Math.ceil((activePlan.endDate - new Date()) / (1000 * 60 * 60 * 24))
    }

    // Get monthly chat trends (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const chatTrends = await Chat.aggregate([
      {
        $match: {
          participants: sellerId,
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

    // Get top performing products (by chat inquiries)
    const topProducts = await Chat.aggregate([
      {
        $match: {
          participants: sellerId,
          productContext: { $exists: true },
          chatType: "product_inquiry",
        },
      },
      {
        $group: {
          _id: "$productContext",
          inquiries: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $sort: { inquiries: -1 },
      },
      {
        $limit: 5,
      },
    ])

    res.json({
      overview: {
        totalProducts,
        featuredProducts,
        totalPosts,
        totalChats,
        activeChats,
        recentInquiries,
      },
      planUsage,
      chatTrends,
      topProducts,
    })
  } catch (error) {
    console.error("Error fetching seller analytics:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get detailed product analytics
export const getProductAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id
    const { productId } = req.params

    // Verify product belongs to seller
    const product = await Product.findOne({ _id: productId, owner: sellerId })
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Get chat inquiries for this product
    const inquiries = await Chat.find({
      participants: sellerId,
      productContext: productId,
      chatType: "product_inquiry",
    }).populate("participants", "name email avatar")

    // Get inquiry trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const inquiryTrends = await Chat.aggregate([
      {
        $match: {
          participants: sellerId,
          productContext: productId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    res.json({
      product,
      totalInquiries: inquiries.length,
      inquiries: inquiries.slice(0, 10), // Latest 10 inquiries
      inquiryTrends,
    })
  } catch (error) {
    console.error("Error fetching product analytics:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get seller's subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const sellerId = req.user._id

    const activePlan = await Plan.findOne({
      user: sellerId,
      isActive: true,
      endDate: { $gte: new Date() },
    })

    const planHistory = await Plan.find({
      user: sellerId,
    })
      .sort({ createdAt: -1 })
      .limit(5)

    res.json({
      activePlan,
      planHistory,
    })
  } catch (error) {
    console.error("Error fetching subscription status:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
