import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
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
    image: {
        type: String,
        required: [true, 'Image is required!'],
    },
    category: {
        type: String,
        required: true,
    },

    isFeatured: { //product will be featured on payment by seller
        type: Boolean,
        default: false,
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }


},{timestamps:true}); // Automatically manage createdAt and updatedAt fields

const Product = mongoose.model('Product', productSchema); // Create a model from the schema
export default Product; // Export the model to be used in other parts of the applicatio