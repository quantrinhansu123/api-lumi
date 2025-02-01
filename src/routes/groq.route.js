import express from "express";
import { getGroqChatCompletion } from "../services/groq.services.js";
const router = express.Router();
router.get('/', async (req, res) => {
  const a = await getGroqChatCompletion();
  res.status(200).json({ message: a });
});
export default router;