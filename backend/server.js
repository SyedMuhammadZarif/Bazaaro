import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';
import {connectDB} from './lib/db.js'; // import the database connection function

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json()); // Middleware to parse JSON bodies

app.use('/api/auth', authRoutes); // Use the auth routes for authentication-related endpoints
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  connectDB();
});
