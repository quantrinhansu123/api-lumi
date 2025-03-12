import express from "express";
import { progressCircle } from "../controller/svg.controller.js";
import { progressBar } from "../controller/svg.controller.js";
const router = express.Router();
router.get('/progress', progressCircle);
router.get('/progressbar', progressBar);
export default router;