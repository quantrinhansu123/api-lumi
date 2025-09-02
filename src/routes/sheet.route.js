import express from "express";
import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from 'url';

const router = express.Router();

// Lấy __dirname trong ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn tới file service account key của bạn
// Đảm bảo đường dẫn này chính xác
const KEYFILEPATH = path.join(__dirname, '../..', 'sheetCredentials.json');

// ID của Google Sheet bạn muốn đọc
const SPREADSHEET_ID = '1rI9cHBNlI2Dc-d6VF6zdKiUagBh-VPFrWdddPysuSmo';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút
const cache = new Map(); // Cache riêng cho từng sheet

// Connection pooling - tạo auth client một lần và tái sử dụng
let authClient = null;
let sheetsAPI = null;

// Pre-compile regex cho date detection
const DATE_REGEX = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/;

const isDateString = (str) => {
  return typeof str === 'string' && DATE_REGEX.test(str);
};

const getAuthenticatedClient = async () => {
  if (!authClient) {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Bỏ .readonly để có quyền write
    });
    authClient = await auth.getClient();
    sheetsAPI = google.sheets({ version: 'v4', auth: authClient });
  }
  return sheetsAPI;
};

