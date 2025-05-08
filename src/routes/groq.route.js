import express from "express";
import { goodMorningController, queryController } from "../controller/groq.controller.js";
const router = express.Router();
router.get('/good-morning', goodMorningController);
router.post('/test', queryController);
export default router;