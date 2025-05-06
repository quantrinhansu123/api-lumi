import express from "express";
import { getQR } from "../controller/qr.controller.js";
const router = express.Router();
router.get('/', getQR);
export default router;