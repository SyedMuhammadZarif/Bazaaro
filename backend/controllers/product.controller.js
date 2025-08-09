import Product from '../models/product.model.js';
import { redis } from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';



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

export const getFeaturedProducts = async (req,res) =>{
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

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" }); // Handle case where product is not found
        }
        if(product.image){
            const publicID = product.image.split("/").pop().split(".")[0]; // Extract public ID from the image URL
            await cloudinary.uploader.destroy(`products/${publicID}`); // Delete image from Cloudinary
            console.log("Image deleted from Cloudinary");
        }
        await Product.findByIdAndDelete(req.params.id); // Delete product from the database
        res.json({ message: "Product deleted successfully" }); // Respond with success message
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal server error" }); // Handle internal server error
        
    }
};
export const createProduct = async (req,res) => {
    try {
        const {name, description, price, catergory, image} = req.body;
        let uploadedImages = [];
        if(Array.isArray(image)){
            if (image.length>3){
                return res.status(400).json({ message: "You can only upload up to 3 images" }); // Handle case where more than 3 images are uploaded
            }
            for (const img of image){
                const uploadRes = cloudinary.uploader.upload(image, {folder: "products"}); // Upload each image to Cloudinary
                uploadedImages.push(uploadRes.secure_url); // Store the secure URL of each uploaded image
            }
        }
        const product = await Product.create({
            name, 
            description,
            price, 
            category, 
            images: uploadedImages, // Use the secure URL from Cloudinary if available
            owner: req.user._id
        })
        res.status(201).json(product);
    } catch (error) {
        console.log("Error creating product:", error);
        res.status(500).json({ message: error.message }); // Handle errors during product creation
        
    };

};



export const updateProduct = async (req, res) => {
    try{
        const {name, description, price, category, newImages, removeImages} = req.body;
        const product = await Product.findById(req.params.id); // Find the product by ID
        if (!product) {
            return res.status(404).json({ message: "Product not found" }); // Handle case where product is not found
        }

        if (Array.isArray(removeImages) && removeImages.length > 0){
            for (const imgUrl of removeImages){
                const publicID = imgUrl.split("/").pop().split(".")[0]; // Extract public ID from the image URL
                await cloudinary.uploader.destroy(`products/${publicID}`); // Delete image from Cloudinary
                product.images = product.images.filter(img => img !== imgUrl); // Remove the image URL from the product's images array
                console.log("Image deleted from Cloudinary");
            }
        }

        if (Array.isArray(newImages) && newImages.length >0){
            if (product.images.length + newImages.length > 3) {
                return res.status(400).json({ message: "You can only upload up to 3 images" }); // Handle case where more than 3 images are uploaded
            }
            for (const img of newImages){
                const uploadRes = await cloudinary.uploader.upload(img, {folder: "products"}); // Upload each new image to Cloudinary
                product.images.push(uploadRes.secure_url); // Add the secure URL of each uploaded image to the product's images array
            }
        }
        if (name) product.name = name; // Update product name if provided
        if (description) product.description = description; // Update product description if provided   
        if (price) product.price = price; // Update product price if provided
        if (category) product.category = category; // Update product category if provided
        await product.save(); // Save the updated product to the database
        res.status(200).json(product); // Respond with the updated product
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Internal server error" }); // Handle internal server error
    }
};


export const getProductsByCatergory = async (req, res) => {
    const { category } = req.params; // Get the category from the request parameters
    try{
        const products = await Product.find({ category }); // Fetch products by category from the database
        if (products.length === 0) {
            return res.status(404).json({ message: "No products found in this category" }); // Handle case where no products are found in the category
        }
        res.status(200).json(products); // Respond with the list of products in the category
    }catch (error) {
        console.error("Error fetching products by category:", error);
        res.status(500).json({ message: "Internal server error" }); // Handle internal server error
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id); // Find the product by ID
        if (!product) {
            return res.status(404).json({ message: "Product not found" }); // Handle case where product is not found
        }
        res.status(200).json(product); // Respond with the product details
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        res.status(500).json({ message: "Internal server error" }); // Handle internal server error
    }
}