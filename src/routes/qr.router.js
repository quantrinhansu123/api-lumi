import express from "express";
import { getQR, getQRText } from "../controller/qr.controller.js";
const router = express.Router();
router.get('/', getQR);
router.get('/text', getQRText);
export default router;


