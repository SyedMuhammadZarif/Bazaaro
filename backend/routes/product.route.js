import express from "express";
import { protectRoute, adminRoute, sellerRoute} from "../middleware/auth.middleware.js";
import { createProduct, getAllProducts, getMyProducts, getFeaturedProducts } from "../controllers/product.controller.js"; // Import the product controller functions
const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts); // Route to get all products
router.get("/myProducts", protectRoute, sellerRoute, getMyProducts); // Route to get products of the logged-in seller
router.get("/featured", getFeaturedProducts); // Route to get featured products
router.post("/", protectRoute, sellerRoute, createProduct); // Route to create a new product

export default router; 