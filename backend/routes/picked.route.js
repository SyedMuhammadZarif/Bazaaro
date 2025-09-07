import express from "express"
import {
  addToPicked,
  removeAllPickedItems,
  removePickedItemById,
  getPickedItems,
  removeDuplicatePickedItems,
} from "../controllers/picked.controller.js" // Added removeDuplicatePickedItems import
import { protectRoute } from "../middleware/auth.middleware.js" // Import the authentication middleware
const router = express.Router()

router.get("/", protectRoute, getPickedItems)
router.post("/", protectRoute, addToPicked) // Use the protectRoute middleware for the POST request
router.post("/remove-duplicates", protectRoute, removeDuplicatePickedItems)
router.post("/cleanup-invalid", protectRoute, async (req, res) => {
  try {
    const user = req.user
    const Product = (await import("../models/product.model.js")).default

    // Get all valid product IDs
    const validProductIds = await Product.find({}).select("_id")
    const validIdStrings = validProductIds.map((p) => p._id.toString())

    // Filter out invalid picked items
    const validPickedItems = user.pickedItems.filter((item) => validIdStrings.includes(item.product.toString()))

    const removedCount = user.pickedItems.length - validPickedItems.length
    user.pickedItems = validPickedItems
    await user.save()

    res.json({
      message: `Removed ${removedCount} invalid picked items`,
      pickedItems: user.pickedItems,
      removedCount,
    })
  } catch (error) {
    console.error("Error cleaning up invalid picked items:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})
router.delete("/", protectRoute, removeAllPickedItems) // Use the protectRoute middleware for the DELETE request
router.delete("/:id", protectRoute, removePickedItemById) // Use the protectRoute middleware for the DELETE request by ID

export default router
