import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import {connectDB} from './lib/db.js'; // import the database connection function
import cookieParser from 'cookie-parser'; // Import cookie parser middleware
import productRoutes from './routes/product.route.js'; // Import product routes if needed
import pickedRoutes from './routes/picked.route.js'; // Import picked items routes if needed

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json()); // Middleware to parse JSON bodies // must give this before routes, got error for this !remember
app.use(cookieParser()); // Middleware to parse cookies
app.use('/api/auth', authRoutes); // Use the auth routes for authentication-related endpoints
app.use('/api/products', productRoutes); // Use the product routes for product-related endpoints
app.use('/api/pickedItems', pickedRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  connectDB();
});