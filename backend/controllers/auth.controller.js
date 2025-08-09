import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis.js';
import { set } from 'mongoose';
import cookieParser from 'cookie-parser';

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken }; 
}

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refreshToken:${userId}`, refreshToken, 'EX', 60 * 60 * 24 * 7); // Store refresh token in Redis with a 7-day expiration
};     

const setCookies = (res,accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production)
        sameSite: "strict",
        maxAge: 15 * 60 * 1000 // 15 minutes
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production)
        sameSite: "strict",
        maxAge: 7 * 24* 60  *60* 1000 // 7 days (need to give ms here)
    })
};


export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken; // Get the refresh token from cookies
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" }); // Handle missing refresh token
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); // Verify the refresh token
        const storedToken = await redis.get(`refreshToken:${decoded.userId}`); // Get the stored refresh token from Redis
        
        if (storedToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" }); // Handle invalid refresh token
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' }); // Generate a new access token
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            sameSite: "strict",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });
        res.json({message: "Access token refreshed successfully" }); // Respond 
    } catch (error) {
        console.error("Refresh token Controller error:", error.message)
        res.status(500).json({ message: "server error", error: error.message });
    }
};


export const signup = async (req, res) => {
    const { email, password, name, role } = req.body; // Destructure email, password, and name from the request body
    try {
        
        const userExists = await User.findOne({email}); // Check if user already exists

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' }); 
        }
        const user = await User.create({name, email, password, role}); // New user creation

        //authenticate
        const {accessToken, refreshToken} = generateTokens(user._id); // Generate auth tokens, mongo stores as _id
        await storeRefreshToken(user._id, refreshToken); // Store the refresh token in Redis
        setCookies(res, accessToken, refreshToken); // Set cookies in the response


        res.status(201).json({user:{
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }, message: "User Created Successfully"}); // Respond with user details and tokens
        
    } 
    catch (error) {
        res.status(500).json({ message: error.message }); // Handle errors
    }
};

export const login = async(req,res)=>{
    const {email, password} = req.body;
    try {
         // Destructure email and password from the request body
        const user = await User.findOne({email}); // Find user by email
        if (user&&(await user.comparePassword(password))) { // Check if user exists and password matches
            const {accessToken, refreshToken} = generateTokens(user._id); // Generate auth tokens
            await storeRefreshToken(user._id, refreshToken); // Store the refresh token in Redis
            setCookies(res, accessToken, refreshToken); // Set cookies in the response
    
            res.status(200).json({user:{
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }, message: "Login Successful"}); // Respond with user details and tokens
        }
        else {
            res.status(401).json({ message: "Invalid email or password" }); // Handle invalid credentials
        }
    } catch (error) {
        
    }

};

export const logout = async(req,res)=>{
    try {
        const refreshToken = req.cookies.refreshToken; // Get the refresh token from cookies
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); // Verify the refresh token
            await redis.del(`refreshToken:${decoded.userId}`); // Delete the refresh token from Redis
        }
        res.clearCookie("accessToken"); // Clear the access token cookie
        res.clearCookie("refreshToken"); // Clear the refresh token cookie
        res.status(200).json({ message: "Logged out successfully" }); // Respond with success message
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Logout failed", error: error.message }); // Handle errors
        
    }
};