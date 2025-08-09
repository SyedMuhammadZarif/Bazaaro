import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Import bcrypt for password hashing
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required!"],
    },
    email: {
        type: String,
        required: [true, "Email is required!"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password:{
        type: String,
        required: [true, "Password is required!"],
        minlength: [8, "Password must be at least 8 characters long!"],
    },
    profilePicture: {
        type: String,
        default: "https://example.com/default-profile-picture.png", // Default profile picture URL
    },

    coverPicture:{
        type: String,
        default: "https://example.com/default-cover-picture.png", // Default cover picture URL
    },
    
    pickedItems:[{
        product:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            }
        
        }], 
    
    role:{
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        default: 'buyer'
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});



//pre-save hook to hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next(); // If password is not modified, skip hashing
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

userSchema.methods.comparePassword = async function (password){ // Method to compare password
    return bcrypt.compare(password, this.password);
}
const User = mongoose.model('User', userSchema);

export default User;