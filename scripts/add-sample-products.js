const mongoose = require("mongoose")
require("dotenv").config()

// Product schema (assuming based on your existing structure)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  category: { type: String },
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const Product = mongoose.model("Product", productSchema)

const sampleProducts = [
  {
    name: "Vintage Leather Jacket",
    price: 299.99,
    description: "Classic brown leather jacket with vintage styling",
    image: "/vintage-leather-jacket.png",
    category: "Clothing",
    inStock: true,
  },
  {
    name: "Wireless Bluetooth Headphones",
    price: 149.99,
    description: "High-quality wireless headphones with noise cancellation",
    image: "/wireless-bluetooth-headphones.jpg",
    category: "Electronics",
    inStock: true,
  },
  {
    name: "Artisan Coffee Beans",
    price: 24.99,
    description: "Premium single-origin coffee beans, freshly roasted",
    image: "/artisan-coffee-beans.jpg",
    category: "Food & Beverage",
    inStock: true,
  },
  {
    name: "Minimalist Watch",
    price: 199.99,
    description: "Elegant minimalist watch with leather strap",
    image: "/minimalist-watch.png",
    category: "Accessories",
    inStock: true,
  },
  {
    name: "Organic Cotton T-Shirt",
    price: 29.99,
    description: "Soft organic cotton t-shirt in various colors",
    image: "/organic-cotton-tshirt.png",
    category: "Clothing",
    inStock: true,
  },
]

async function addSampleProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("Connected to MongoDB")

    // Clear existing products (optional)
    await Product.deleteMany({})
    console.log("Cleared existing products")

    // Add sample products
    const products = await Product.insertMany(sampleProducts)
    console.log(`Added ${products.length} sample products:`)
    products.forEach((product) => {
      console.log(`- ${product.name} (ID: ${product._id})`)
    })

    await mongoose.disconnect()
    console.log("Disconnected from MongoDB")
  } catch (error) {
    console.error("Error adding sample products:", error)
    process.exit(1)
  }
}

addSampleProducts()
