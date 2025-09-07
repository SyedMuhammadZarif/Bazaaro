import User from "../models/user.model.js"
import Product from "../models/product.model.js"
import { Chat } from "../models/chat.model.js"
import cloudinary from "../lib/cloudinary.js"

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params
    console.log("[v0] Backend: getUserProfile called for userId:", userId)

    // Validate ObjectId format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("[v0] Backend: Invalid ObjectId format:", userId)
      return res.status(400).json({ message: "Invalid user ID format" })
    }

    const user = await User.findById(userId)
      .select("-password -refreshToken")
      

    console.log("[v0] Backend: User found:", user ? "Yes" : "No")

    if (!user) {
      console.log("[v0] Backend: User not found, returning 404")
      return res.status(404).json({ message: "User not found" })
    }

    // If user is a seller, get their products and store stats
    let sellerData = null
    if (user.role === "seller") {
      const products = await Product.find({ owner: userId }).limit(12)
      const totalProducts = await Product.countDocuments({ owner: userId })
      const totalChats = await Chat.countDocuments({ participants: userId })

      sellerData = {
        products,
        totalProducts,
        totalChats,
        joinedDate: user.createdAt,
      }
    }

    const responseData = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        coverPicture: user.coverPicture,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
        // Only include pickedItems if viewing own profile and user is authenticated
        ...(req.user && req.user._id === userId && { pickedItems: user.pickedItems }),
      },
      sellerData,
    }

    console.log("[v0] Backend: Sending response with user data:", responseData.user ? "Yes" : "No")
    res.json(responseData)
  } catch (error) {
    console.error("[v0] Backend: Error fetching user profile:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id
    const { name, bio, profilePicture, coverPicture } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update profile picture if provided
    if (profilePicture && profilePicture !== user.profilePicture) {
      // Delete old profile picture from cloudinary if it's not the default
      if (user.profilePicture && !user.profilePicture.includes("default-profile-picture")) {
        const publicId = user.profilePicture.split("/").pop().split(".")[0]
        await cloudinary.uploader.destroy(`profiles/${publicId}`)
      }

      // Upload new profile picture
      const uploadRes = await cloudinary.uploader.upload(profilePicture, {
        folder: "profiles",
        width: 400,
        height: 400,
        crop: "fill",
      })
      user.profilePicture = uploadRes.secure_url
    }

    // Update cover picture if provided
    if (coverPicture && coverPicture !== user.coverPicture) {
      // Delete old cover picture from cloudinary if it's not the default
      if (user.coverPicture && !user.coverPicture.includes("default-cover-picture")) {
        const publicId = user.coverPicture.split("/").pop().split(".")[0]
        await cloudinary.uploader.destroy(`covers/${publicId}`)
      }

      // Upload new cover picture
      const uploadRes = await cloudinary.uploader.upload(coverPicture, {
        folder: "covers",
        width: 1200,
        height: 400,
        crop: "fill",
      })
      user.coverPicture = uploadRes.secure_url
    }

    // Update other fields
    if (name) user.name = name
    if (bio !== undefined) user.bio = bio

    await user.save()

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        coverPicture: user.coverPicture,
        bio: user.bio,
        role: user.role,
      },
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get seller store page
export const getSellerStore = async (req, res) => {
  try {
    const { sellerId } = req.params
    const { page = 1, limit = 12, category, search } = req.query

    const seller = await User.findById(sellerId).select("-password -refreshToken")
    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" })
    }

    // Build product query
    const productQuery = { owner: sellerId }
    if (category && category !== "all") {
      productQuery.category = category
    }
    if (search) {
      productQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    const products = await Product.find(productQuery)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const totalProducts = await Product.countDocuments(productQuery)
    const totalPages = Math.ceil(totalProducts / limit)

    // Get store statistics
    const totalChats = await Chat.countDocuments({ participants: sellerId })
    const categories = await Product.distinct("category", { owner: sellerId })

    res.json({
      seller: {
        _id: seller._id,
        name: seller.name,
        profilePicture: seller.profilePicture,
        coverPicture: seller.coverPicture,
        bio: seller.bio,
        createdAt: seller.createdAt,
      },
      products,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        totalProducts,
        totalChats,
        categories,
      },
    })
  } catch (error) {
    console.error("Error fetching seller store:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Error changing password:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
