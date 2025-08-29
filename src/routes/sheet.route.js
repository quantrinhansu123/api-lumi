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
const MAX_ROWS = 10000; // Giới hạn số rows để tránh memory issues
let cachedData = null;
let lastFetch = 0;

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
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    authClient = await auth.getClient();
    sheetsAPI = google.sheets({ version: 'v4', auth: authClient });
  }
  return sheetsAPI;
}; 

/**
 * Hàm trợ giúp để định dạng đối tượng Date thành chuỗi "MM/dd/yyyy".
 * @param {Date} dateObj Đối tượng Date cần định dạng.
 * @returns {string|null} Chuỗi ngày đã định dạng hoặc null nếu không hợp lệ.
 */
const formatDateToMMddyyyy = (dateObj) => {
  if (!(dateObj instanceof Date) || isNaN(dateObj)) {
    return null; 
  }
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${month}/${day}/${year}`;
};

router.get('/getAll', async (req, res) => {
  // Lấy giá trị callback từ query parameters
  const callbackName = req.query.callback;

  // Kiểm tra cache trước
  const now = Date.now();
  if (cachedData && (now - lastFetch) < CACHE_DURATION) {
    console.log('Cache hit - returning cached data');
    const jsonString = JSON.stringify(cachedData);
    
    if (callbackName) {
      res.set('Content-Type', 'application/javascript');
      res.send(`${callbackName}(${jsonString});`);
    } else {
      res.set('Content-Type', 'application/json');
      res.send(jsonString);
    }
    return;
  }

  let result = {}; // Khởi tạo đối tượng result để chứa kết quả cuối cùng

  try {
    // Sử dụng authenticated client đã được cache
    const sheets = await getAuthenticatedClient();

    // 2. Lấy dữ liệu từ Sheet "F3"
    const range = 'F3!A:DA';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueRenderOption: 'FORMATTED_VALUE', 
    });

    const values = response.data.values;

    if (!values || values.length < 2) {
      result = { headers: [], rows: [], error: 'Không tìm thấy dữ liệu hoặc dữ liệu không đủ trong Google Sheet F3.' };
    } else {
      const headers = values[0];
      // Giới hạn số lượng rows để tránh memory issues
      let dataRows = values.slice(1, MAX_ROWS + 1);

      // --- Xác định cột để sắp xếp
      const SORT_COL = "Ngày Kế toán đối soát với FFM lần 2";
      const sortIdx = headers.indexOf(SORT_COL);

      // --- Tối ưu sorting function
      if (sortIdx !== -1) {
        dataRows.sort((a, b) => {
          const valA = a[sortIdx];
          const valB = b[sortIdx];
          
          if (!valA) return 1;
          if (!valB) return -1;
          
          const timeA = new Date(valA).getTime();
          const timeB = new Date(valB).getTime();
          
          if (isNaN(timeA)) return 1;
          if (isNaN(timeB)) return -1;
          
          return timeB - timeA;
        });
      }

      // --- Tối ưu mapping với for loop thay vì forEach
      const resultRows = dataRows.map((row) => {
        const obj = {};
        for (let ci = 0; ci < row.length && ci < headers.length; ci++) {
          const header = headers[ci];
          let value = row[ci];

          if (header !== SORT_COL && value && isDateString(value)) {
            const parsedDate = new Date(value);
            if (!isNaN(parsedDate.getTime())) {
              value = formatDateToMMddyyyy(parsedDate);
            }
          }
          obj[header] = value;
        }
        return obj;
      });

      result = { headers: headers, rows: resultRows };
    }

    // Lưu vào cache nếu thành công
    if (!result.error) {
      cachedData = result;
      lastFetch = now;
      console.log('Data cached successfully');
    }

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu từ Google Sheet:', error.message);
    result = { error: 'Đã xảy ra lỗi khi lấy dữ liệu từ Google Sheet.', details: error.message };
    // Đặt status code cho lỗi, nhưng vẫn sẽ được bọc trong JSONP nếu có callback
    res.status(500); 
  }

  const jsonString = JSON.stringify(result);

  if (callbackName) {
    // Trả về JSONP nếu có callback
    res.set('Content-Type', 'application/javascript');
    res.send(`${callbackName}(${jsonString});`);
  } else {
    // Trả về JSON thông thường
    res.set('Content-Type', 'application/json');
    res.send(jsonString);
  }
});

export default router;