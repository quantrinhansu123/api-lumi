import express from "express";
import { goodMorningController } from "../controller/groq.controller.js";
const router = express.Router();
router.get('/good-morning', goodMorningController);
export default router;