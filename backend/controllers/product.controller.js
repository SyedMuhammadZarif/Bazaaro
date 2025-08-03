import Product from '../models/product.model.js';
import { redis } from '../lib/redis.js';

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products from the database
        res.status(200).json(products); // Respond with the list of products
    } catch (error) {
        console.log("Error fetching products:", error);
        res.status(500).json({ message: error.message }); // Handle errors
    }
};

export const getMyProducts = async (req, res) => {
    try {
        const userId = req.user._id; // Get the logged-in user's ID from the request
        const products = await Product.find({ owner: userId }); // Fetch products belonging to the logged-in seller
        res.status(200).json(products); // Respond with the list of seller's products
    } catch (error) {
        console.log("Error fetching seller's products:", error);
        res.status(500).json({ message: error.message }); // Handle errors
    }
}

export const getFeaturedProdicts = async (req,res) =>{
    try{
        let featuredProducts = await redis.get("featured_products");
        if (featuredProducts) {
            featuredProducts = JSON.parse(featuredProducts); // Parse the cached featured products
            return res.status(200).json(featuredProducts); // Respond with cached featured products
        }
        featuredProducts = await Product.find({ isFeatured: true }).lean(); // Fetch featured products from the database

        if(!featuredProducts){
            return res.status(404).json({ message: "No featured products found" }); // Handle case where no featured products are found
        }

        await redis.set("featured_products", JSON.stringify(featuredProducts));
        res.json(featuredProducts);
    } catch (error) {
        console.error("Error fetching featured products:", error);
        res.status(500).json({ message: "Internal server error" }); // Handle internal server error
    }
};
