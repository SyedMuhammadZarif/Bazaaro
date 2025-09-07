import Product from "../models/product.model.js"
import Plan from "../models/plan.model.js"
import { redis } from "../lib/redis.js"
import cloudinary from "../lib/cloudinary.js"

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate("owner", "name profilePicture")
    res.status(200).json(products)
  } catch (error) {
    console.log("Error fetching products:", error)
    res.status(500).json({ message: error.message })
  }
}

export const getMyProducts = async (req, res) => {
  try {
    const userId = req.user._id // Get the logged-in user's ID from the request
    const products = await Product.find({ owner: userId }) // Fetch products belonging to the logged-in seller
    res.status(200).json(products) // Respond with the list of seller's products
  } catch (error) {
    console.log("Error fetching seller's products:", error)
    res.status(500).json({ message: error.message }) // Handle errors
  }
}

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products")
    if (featuredProducts) {
      featuredProducts = JSON.parse(featuredProducts)
      return res.status(200).json(featuredProducts)
    }

    featuredProducts = await Product.find({ isActive: true, isFeatured: true })
      .populate("owner", "name profilePicture")
      .lean()

    if (!featuredProducts || featuredProducts.length === 0) {
      return res.status(200).json([]) // Return empty array instead of 404
    }

    await redis.set("featured_products", JSON.stringify(featuredProducts))
    res.json(featuredProducts)
  } catch (error) {
    console.error("Error fetching featured products:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" }) // Handle case where product is not found
    }
    if (product.image) {
      const publicID = product.image.split("/").pop().split(".")[0] // Extract public ID from the image URL
      await cloudinary.uploader.destroy(`products/${publicID}`) // Delete image from Cloudinary
      console.log("Image deleted from Cloudinary")
    }
    await Product.findByIdAndDelete(req.params.id) // Delete product from the database
    res.json({ message: "Product deleted successfully" }) // Respond with success message
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ message: "Internal server error" }) // Handle internal server error
  }
}

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, images } = req.body
    const userId = req.user._id

    // Check current product count
    const currentProductCount = await Product.countDocuments({ owner: userId, isActive: true })

    // Get user's active plan
    const activePlan = await Plan.findOne({
      user: userId,
      isActive: true,
      endDate: { $gte: new Date() },
    })

    // Determine product limit based on plan
    let maxProducts = 5 // Free tier default
    if (activePlan) {
      maxProducts = activePlan.features.maxProducts
    }

    // Check if user has reached their product limit
    if (currentProductCount >= maxProducts) {
      return res.status(403).json({
        message: `Product limit reached. Your current plan allows ${maxProducts} products. Upgrade your subscription to create more.`,
        currentProducts: currentProductCount,
        maxProducts: maxProducts,
        planType: activePlan ? activePlan.planType : "free",
      })
    }

    const uploadedImages = []
    if (Array.isArray(images)) {
      if (images.length > 3) {
        return res.status(400).json({ message: "You can only upload up to 3 images" })
      }
      for (const img of images) {
        const uploadRes = await cloudinary.uploader.upload(img, { folder: "products" })
        uploadedImages.push(uploadRes.secure_url)
      }
    }
    const product = await Product.create({
      name,
      description,
      price,
      category,
      images: uploadedImages,
      owner: req.user._id,
      isActive: true,
    })
    res.status(201).json(product)
  } catch (error) {
    console.log("Error creating product:", error)
    res.status(500).json({ message: error.message })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, newImages, removeImages } = req.body
    const product = await Product.findById(req.params.id) // Find the product by ID
    if (!product) {
      return res.status(404).json({ message: "Product not found" }) // Handle case where product is not found
    }

    if (Array.isArray(removeImages) && removeImages.length > 0) {
      for (const imgUrl of removeImages) {
        const publicID = imgUrl.split("/").pop().split(".")[0] // Extract public ID from the image URL
        await cloudinary.uploader.destroy(`products/${publicID}`) // Delete image from Cloudinary
        product.images = product.images.filter((img) => img !== imgUrl) // Remove the image URL from the product's images array
        console.log("Image deleted from Cloudinary")
      }
    }

    if (Array.isArray(newImages) && newImages.length > 0) {
      if (product.images.length + newImages.length > 3) {
        return res.status(400).json({ message: "You can only upload up to 3 images" })
      }
      for (const img of newImages) {
        const uploadRes = await cloudinary.uploader.upload(img, { folder: "products" }) // Upload each new image to Cloudinary
        product.images.push(uploadRes.secure_url) // Add the secure URL of each uploaded image to the product's images array
      }
    }
    if (name) product.name = name // Update product name if provided
    if (description) product.description = description // Update product description if provided
    if (price) product.price = price // Update product price if provided
    if (category) product.category = category // Update product category if provided
    await product.save() // Save the updated product to the database
    res.status(200).json(product) // Respond with the updated product
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ message: "Internal server error" }) // Handle internal server error
  }
}

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params // Get the category from the request parameters
  try {
    const products = await Product.find({ category }) // Fetch products by category from the database
    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this category" }) // Handle case where no products are found in the category
    }
    res.status(200).json(products) // Respond with the list of products in the category
  } catch (error) {
    console.error("Error fetching products by category:", error)
    res.status(500).json({ message: "Internal server error" }) // Handle internal server error
  }
}

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id) // Find the product by ID
    if (!product) {
      return res.status(404).json({ message: "Product not found" }) // Handle case where product is not found
    }
    res.status(200).json(product) // Respond with the product details
  } catch (error) {
    console.error("Error fetching product by ID:", error)
    res.status(500).json({ message: "Internal server error" }) // Handle internal server error
  }
}
