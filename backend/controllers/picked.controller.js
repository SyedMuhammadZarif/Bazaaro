import Product from "../models/product.model.js"

export const addToPicked = async (req, res) => {
  try {
    const { productId } = req.body
    const user = req.user // Get the authenticated user from the request

    console.log("[v0] Backend: Received productId:", productId)
    console.log("[v0] Backend: ProductId type:", typeof productId)
    console.log("[v0] Backend: User ID:", user._id)
    console.log("[v0] Backend: Current picked items before adding:", JSON.stringify(user.pickedItems, null, 2))

    const existingPicked = user.pickedItems.find((item) => {
      return item.product.toString() === productId.toString()
    })

    if (existingPicked) {
      return res.status(400).json({ message: "Item already picked" })
    } else {
      user.pickedItems.push({ product: productId })
      await user.save() // Save the updated user with the new picked item

      console.log("[v0] Backend: Picked items after adding:", JSON.stringify(user.pickedItems, null, 2))
      res.status(201).json({ message: "Item added to picked successfully", pickedItems: user.pickedItems })
    }
  } catch (error) {
    console.error("Error adding to picked items:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

/* need to make chat functionality first before implementing this function 

export const requestInfo = async (req, res) => { // this will be used to send a message to the seller requesting information on the product
    try {
        const { id: productID } = req.params; // Get the product ID from the request parameters
        const user = req.user; // Get the authenticated user from the request
        const 

    }
} */

export const removeDuplicatePickedItems = async (req, res) => {
  try {
    const user = req.user
    const seen = new Set()
    const uniquePickedItems = []

    user.pickedItems.forEach((item) => {
      const itemId = item.product.toString()
      if (!seen.has(itemId)) {
        seen.add(itemId)
        uniquePickedItems.push(item)
      }
    })

    const duplicatesRemoved = user.pickedItems.length - uniquePickedItems.length
    user.pickedItems = uniquePickedItems
    await user.save()

    res.json({
      message: `Removed ${duplicatesRemoved} duplicate items`,
      pickedItems: user.pickedItems,
      duplicatesRemoved,
    })
  } catch (error) {
    console.error("Error removing duplicates:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const removeAllPickedItems = async (req, res) => {
  try {
    const { productId } = req.body
    const user = req.user // Get the authenticated user from the request
    if (!productId) {
      user.pickedItems = [] // Clear all picked items
    } else {
      user.pickedItems = user.pickedItems.filter((item) => item.product.toString() !== productId.toString())
    }
    await user.save() // Save the updated user with the cleared or modified picked items
    res.json(user.pickedItems) // Return the updated picked items
  } catch (error) {
    console.error("Error removing picked items:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const removePickedItemById = async (req, res) => {
  try {
    const { id: productId } = req.params // Get the product ID from the request parameters
    const user = req.user // Get the authenticated user from the request
    user.pickedItems = user.pickedItems.filter((item) => item.product.toString() !== productId.toString())
    await user.save() // Save the updated user with the removed picked item
    res.json(user.pickedItems) // Return the updated picked items
  } catch (error) {
    console.error("Error deleting picked item:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

// Get all picked products for current user
export const getPickedItems = async (req, res) => {
  try {
    console.log("[v0] User picked items raw data:", JSON.stringify(req.user.pickedItems, null, 2))

    const productIds = req.user.pickedItems.map((item) => item.product).filter(Boolean) // Remove any undefined values

    console.log("[v0] Extracted product IDs:", productIds)

    const totalProducts = await Product.countDocuments()
    console.log("[v0] Total products in collection:", totalProducts)

    // Check if any of the first few product IDs exist
    if (productIds.length > 0) {
      const sampleProduct = await Product.findById(productIds[0])
      console.log("[v0] Sample product lookup result:", sampleProduct ? "Found" : "Not found")

      // Check what products actually exist
      const allProducts = await Product.find({}).limit(5).select("_id name")
      console.log("[v0] Sample existing products:", allProducts)
    }

    const products = await Product.find({ _id: { $in: productIds } }).populate("owner", "name profilePicture")

    console.log("[v0] Found products:", products.length)

    if (products.length === 0 && productIds.length > 0) {
      console.log("[v0] WARNING: User has picked items but no matching products found in database")
      console.log("[v0] This indicates data inconsistency - picked items reference non-existent products")

      // Return empty array with helpful message for debugging
      return res.json({
        pickedItems: [],
        message: "No matching products found for picked items",
        debug: {
          pickedItemsCount: productIds.length,
          totalProductsInDB: totalProducts,
          issue: "Picked items reference products that don't exist in database",
        },
      })
    }

    const pickedItems = products.map((product) => {
      const pickedItem = req.user.pickedItems.find((item) => {
        return item.product.toString() === product._id.toString()
      })
      return {
        _id: pickedItem.product,
        product: product.toJSON(),
        pickedAt: pickedItem.createdAt || new Date(),
      }
    })

    console.log("[v0] Final picked items response:", pickedItems.length)
    res.json({ pickedItems }) // Return the properly formatted picked items
  } catch (error) {
    console.error("Error fetching picked items:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
