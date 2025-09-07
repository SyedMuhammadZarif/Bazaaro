import Post from "../models/post.model.js"
import Plan from "../models/plan.model.js"
import cloudinary from "../lib/cloudinary.js"

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, images } = req.body
    const userId = req.user._id

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Post content is required" })
    }

    // Check current post count
    const currentPostCount = await Post.countDocuments({ author: userId, isActive: true })

    // Get user's active plan
    const activePlan = await Plan.findOne({
      user: userId,
      isActive: true,
      endDate: { $gte: new Date() },
    })

    // Determine post limit based on plan
    let maxPosts = 5 // Free tier default
    if (activePlan) {
      maxPosts = activePlan.features.maxPosts
    }

    // Check if user has reached their post limit
    if (currentPostCount >= maxPosts) {
      return res.status(403).json({
        message: `Post limit reached. Your current plan allows ${maxPosts} posts. Upgrade your subscription to post more.`,
        currentPosts: currentPostCount,
        maxPosts: maxPosts,
        planType: activePlan ? activePlan.planType : "free",
      })
    }

    // Process images if provided
    let uploadedImages = []
    if (Array.isArray(images) && images.length > 0) {
      if (images.length > 3) {
        return res.status(400).json({ message: "You can only upload up to 3 images" })
      }
      for (const img of images) {
        const uploadRes = await cloudinary.uploader.upload(img, { folder: "posts" })
        uploadedImages.push(uploadRes.secure_url)
      }
    }

    // Create new post
    const newPost = new Post({
      content: content.trim(),
      author: userId,
      images: uploadedImages,
    })

    await newPost.save()

    // Populate author details
    await newPost.populate("author", "name profilePicture role")

    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    })
  } catch (error) {
    console.error("Error creating post:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get all posts (feed)
export const getAllPosts = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const posts = await Post.find({ isActive: true })
      .populate("author", "name profilePicture role")
      .populate("likes.user", "name")
      .populate("comments.user", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalPosts = await Post.countDocuments({ isActive: true })
    const totalPages = Math.ceil(totalPosts / limit)

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get posts by specific user
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const posts = await Post.find({ author: userId, isActive: true })
      .populate("author", "name profilePicture role")
      .populate("likes.user", "name")
      .populate("comments.user", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalPosts = await Post.countDocuments({ author: userId, isActive: true })
    const totalPages = Math.ceil(totalPosts / limit)

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching user posts:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Like/unlike a post
export const toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user._id

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    const existingLike = post.likes.find((like) => like.user.toString() === userId.toString())

    if (existingLike) {
      // Remove like
      post.likes = post.likes.filter((like) => like.user.toString() !== userId.toString())
    } else {
      // Add like
      post.likes.push({ user: userId })
    }

    await post.save()
    await post.populate("likes.user", "name")

    res.json({
      message: existingLike ? "Post unliked" : "Post liked",
      likes: post.likes,
      likesCount: post.likes.length,
    })
  } catch (error) {
    console.error("Error toggling like:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params
    const { content } = req.body
    const userId = req.user._id

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Comment content is required" })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    post.comments.push({
      user: userId,
      content: content.trim(),
    })

    await post.save()
    await post.populate("comments.user", "name profilePicture")

    res.status(201).json({
      message: "Comment added successfully",
      comments: post.comments,
    })
  } catch (error) {
    console.error("Error adding comment:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Update a post
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user._id
    const { content, images, isPublic } = req.body

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Check if user owns the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only update your own posts" })
    }

    // Update post fields
    if (content !== undefined) post.content = content
    if (isPublic !== undefined) post.isPublic = isPublic

    // Process images if provided
    if (images !== undefined) {
      if (Array.isArray(images) && images.length > 0) {
        if (images.length > 3) {
          return res.status(400).json({ message: "You can only upload up to 3 images" })
        }
        
        // Check if images are base64 (new uploads) or URLs (existing images)
        const newImages = []
        const existingImages = []
        
        for (const img of images) {
          if (img.startsWith('data:image/')) {
            // New base64 image - upload to Cloudinary
            const uploadRes = await cloudinary.uploader.upload(img, { folder: "posts" })
            newImages.push(uploadRes.secure_url)
          } else if (img.startsWith('http')) {
            // Existing Cloudinary URL - keep as is
            existingImages.push(img)
          }
        }
        
        post.images = [...existingImages, ...newImages]
      } else {
        post.images = []
      }
    }

    await post.save()

    // Populate author information for response
    await post.populate("author", "name profilePicture")

    res.json({ message: "Post updated successfully", post })
  } catch (error) {
    console.error("Error updating post:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user._id

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Check if user owns the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own posts" })
    }

    // Soft delete
    post.isActive = false
    await post.save()

    res.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting post:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
