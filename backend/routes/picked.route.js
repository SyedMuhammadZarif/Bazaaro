import express from 'express';
import { addToPicked, removeAllPickedItems, removePickedItemById, getPickedItems } from '../controllers/picked.controller.js'; // Import the controller function for adding picked items
import { protectRoute } from '../middleware/auth.js'; // Import the authentication middleware
const router = express.Router();

router.get("/", protectRoute, getPickedItems);
router.post("/", protectRoute, addToPicked); // Use the protectRoute middleware for the POST request
router.delete("/", protectRoute, removeAllPickedItems); // Use the protectRoute middleware for the DELETE request
router.delete("/:id", protectRoute, removePickedItemById); // Use the protectRoute middleware for the DELETE request by ID

export default router;