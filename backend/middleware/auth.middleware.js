import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try{
        const accessToken = req.cookies.accessToken; // Get access token from cookies
        if (!accessToken) {
            return res.status(401).json({ message: " Unauthorized! Access token is missing" }); // Handle missing access token
        }

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET); // Verify the access token
            req.user = await User.findById(decoded.userId); // Find user by ID from the token
            if (!req.user) {
                return res.status(404).json({ message: "User not found" }); // Handle user not found
            }
            next(); // Proceed to the next middleware or route handler
        }
        catch (error) {
            console.error("Access token verification failed:", error);
            return res.status(403).json({ message: "Invalid access token" }); // Handle invalid access token
        }
        throw error;
    } catch (error) {
        console.error("Error in protectRoute middleware:", error);
        res.status(500).json({ message: "Internal server error" }); // Handle internal server error
    }
}

export const sellerRoute = (req, res, next) => {
    if (req.user && req.user.role === 'seller') {
        next(); // Proceed if the user is a seller
    } else {
        res.status(403).json({ message: "Access denied: Not a seller" }); // Handle access denied for non-buyers
    }
}

export const adminRoute = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // Proceed if the user is an admin
    } else {
        res.status(403).json({ message: "Access denied: Not an admin" }); // Handle access denied for non-admins
    }
}