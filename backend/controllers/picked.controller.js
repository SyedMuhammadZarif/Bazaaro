export const addToPicked = async (req, res) => {
    try{
        const {productId} = req.body;
        const user = req.user; // Get the authenticated user from the request
        const existingPicked = user.pickedItems.find(item => item.id === productId);
        if(existingPicked){
            return res.status(400).json({ message: "Item already picked" });
        }else{
            user.pickedItems.push({ productId });
            await user.save(); // Save the updated user with the new picked item
            res.status(201).json({ message: "Item added to picked successfully", pickedItems: user.pickedItems });
        }

    }catch(error){
        console.error("Error adding to picked items:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/* need to make chat functionality first before implementing this function 

export const requestInfo = async (req,res) => { //this will be used to send a message to the seller requesting information on the product
    try{
        const {id: productID} = req.params; // Get the product ID from the request parameters
        const user = req.user; // Get the authenticated user from the request
        const 

    }
}*/

export const removeAllPickedItems = async (req, res) => {
    try{
        const {productId} = req.body;
        const user = req.user; // Get the authenticated user from the request
        if (!productId){
            user.pickedItems = []; // Clear all picked items
        } else{
            user.pickedItems = user.pickedItems.filter(item => item.id !== productId); // Remove specific item
        }
        await user.save(); // Save the updated user with the cleared or modified picked items
        res.json(user.pickedItems); // Return the updated picked items
    }catch(error){
        console.error("Error removing picked items:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const removePickedItemById = async (req, res) => {
    try{
        const {id: productId} = req.params; // Get the product ID from the request parameters
        const user = req.user; // Get the authenticated user from the request
        user.pickedItems = user.pickedItems.filter(item => item.id !== productId); // Remove the specific item by ID
        await user.save(); // Save the updated user with the removed picked item
        res.json(user.pickedItems); // Return the updated picked items

    }
    catch(error){
        console.error("Error deleting picked item:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all picked products for current user
export const getPickedItems = async (req, res) => {
    try {
        
        const products = await Product.find({ _id: { $in: req.user.pickedItems } }); // Fetch all products that are in the user's picked items
        const pickedtems = products.map((product) => { // Map through the products to format the response
            const item = req.user.pickedItems.find((pickedItem) => pickedItem.id === product.id); // Find the corresponding picked item
            return { ...product.toJSON()}; //need to add info about message sent or not here later
        });
        res.json(pickedItems);;
    } catch (error) {
        console.error("Error fetching picked items:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};