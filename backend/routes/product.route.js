import express from "express"
import { protectRoute, sellerRoute } from "../middleware/auth.middleware.js"
import {
  createProduct,
  getAllProducts,
  getMyProducts,
  getFeaturedProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductsByCategory,
} from "../controllers/product.controller.js"

const router = express.Router()

router.get("/", protectRoute, getAllProducts)
router.get("/myProducts", protectRoute, sellerRoute, getMyProducts)
router.get("/featured", getFeaturedProducts)
router.get("/category/:category", getProductsByCategory)
router.get("/:id", getProductById)
router.post("/", protectRoute, sellerRoute, createProduct)
router.put("/:id", protectRoute, sellerRoute, updateProduct)
router.delete("/:id", protectRoute, sellerRoute, deleteProduct)

export default router
