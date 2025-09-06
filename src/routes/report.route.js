import express from "express";
import ReportController from '../controller/report.controller.js';

const router = express.Router();
const reportController = new ReportController();

// ===== REPORT GENERATION ROUTES =====
/**
 * GET /api/report/available
 * Lấy danh sách các loại báo cáo có sẵn
 */
router.get('/available', reportController.getAvailableReports);

/**
 * POST /api/report/generate
 * Tạo báo cáo theo sheetName
 * Body: { sheetName: string }
 */
router.post('/generate', reportController.generateReport);

export default router;
