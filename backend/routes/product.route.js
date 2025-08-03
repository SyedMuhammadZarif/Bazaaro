import express from "express";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts); // Route to get all products
router.get("/myProducts", protectRoute, sellerRoute, getMyProducts); // Route to get products of the logged-in seller


export default router; 