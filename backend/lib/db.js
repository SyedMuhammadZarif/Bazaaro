import mongoose from 'mongoose';

const connectDB = async () => { // Function to connect to MongoDB
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`); // Log the host of the MongoDB connection
    
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}
export default connectDB;