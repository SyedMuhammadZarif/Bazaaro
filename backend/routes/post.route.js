import express from "express"
import {
  createPost,
  getAllPosts,
  getUserPosts,
  toggleLikePost,
  addComment,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js"
import { protectRoute } from "../middleware/auth.middleware.js"

const router = express.Router()

// Public routes
router.get("/", getAllPosts) // Get all posts for feed
router.get("/user/:userId", getUserPosts) // Get posts by specific user

// Protected routes
router.post("/", protectRoute, createPost) // Create new post
router.put("/:postId", protectRoute, updatePost) // Update post
router.post("/:postId/like", protectRoute, toggleLikePost) // Like/unlike post
router.post("/:postId/comment", protectRoute, addComment) // Add comment
router.delete("/:postId", protectRoute, deletePost) // Delete post

export default router
