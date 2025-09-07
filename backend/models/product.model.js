import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String], // Array of image URLs
      validate: {
        validator: (v) => {
          return v.length <= 3 // Limit to 3 images
        },
        message: "You can only upload up to 3 images",
      },
      required: [true, "At least one image is required!"],
    },
    category: {
      type: String,
      required: true,
    },

    isFeatured: {
      // product will be featured on payment by seller
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
) // Automatically manage createdAt and updatedAt fields

const Product = mongoose.model("Product", productSchema) // Create a model from the schema
export default Product // Export the model to be used in other parts of the application
