import express from "express";
import { getGroqChatCompletion } from "../services/groq.services.js";
import { goodMorningController } from "../controller/groq.controller.js";
const router = express.Router();
router.get('/', goodMorningController);
export default router;