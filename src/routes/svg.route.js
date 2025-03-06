import express from "express";
import { progressCircle } from "../controller/svg.controller.js";
const router = express.Router();
router.get('/progress', progressCircle);
export default router;