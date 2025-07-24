import User from '../models/user.model.js';

export const signup = async (req, res) => {
    const { email, password, name } = req.body; // Destructure email, password, and name from the request body
    try {
        
        const userExists = await User.findOne({email}); // Check if user already exists

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' }); 
        }
        const user = await User.create({name, email, password}); // New user creation
        res.status(201).json({ message: 'User created successfully', user });
    } 
    catch (error) {
        res.status(500).json({ message: error.message }); // Handle errors
    }
};

export const login = async(req,res)=>{
    res.send("Login route called");
};

export const logout = async(req,res)=>{
    res.send("Logout route called");
};




