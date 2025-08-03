import express from "express";
import {login, logout, signup, refreshToken} from '../controllers/auth.controller.js'; // Import the controller functions
const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.post("/refresh-token", refreshToken); // Route for refreshing tokens

export default router; // Export the router to be used in the main server file
