import Product from '../models/product.model.js';

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
        const featuredProducts = await Product.find({ isFeatured: true }); // Fetch featured products from the database
        res.status(200).json(featuredProducts);
    }
}