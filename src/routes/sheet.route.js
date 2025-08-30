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

  // Tạo cache key cho sheet này
  const cacheKey = 'test_f3_all';
  
  // Kiểm tra cache trước
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('Cache hit - returning cached data for:', cacheKey);
    const jsonString = JSON.stringify(cached.data);
    
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

    // 2. Lấy dữ liệu từ Sheet "test f3"
    const range = 'test f3!A:DA';
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
      let dataRows = values.slice(1);

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
      cache.set(cacheKey, {
        data: result,
        timestamp: now
      });
      console.log('Data cached successfully for:', cacheKey);
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

router.get('/getSheets', async (req, res) => {
  // Lấy giá trị callback từ query parameters
  const callbackName = req.query.callback;
  const {sheetName, rangeSheet} = req.query;

  // Tạo cache key cho sheet này
  const cacheKey = `${sheetName}_${rangeSheet}`;
  
  // Kiểm tra cache trước
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('Cache hit - returning cached data for:', cacheKey);
    const jsonString = JSON.stringify(cached.data);
    
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

    const range = `${sheetName}!${rangeSheet}`;
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
      let dataRows = values.slice(1);
      result = { headers: headers, rows: dataRows };
    }

    // Lưu vào cache nếu thành công
    if (!result.error) {
      cache.set(cacheKey, {
        data: result,
        timestamp: now
      });
      console.log('Data cached successfully for:', cacheKey);
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

// Thêm hàm formatDate (từ code Apps Script của bạn)
function formatDate(dateString) {
  // Implement hàm formatDate của bạn ở đây
  if (typeof dateString === 'string' && dateString.includes('/')) {
    const [month, day, year] = dateString.split('/');
    return new Date(year, month - 1, day);
  }
  return dateString;
}

// Thêm route POST để update Google Sheets
router.post('/updateSheets', async (req, res) => {
  const callbackName = req.query.callback;
  
  try {
    const sheets = await getAuthenticatedClient();
    const sheetName = 'test f3'; // Hoặc lấy từ req.body.sheetName
    
    // Lấy headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:1`,
    });
    const headers = headerResponse.data.values[0];
    
    // Lấy tất cả dữ liệu
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:DA`,
    });
    const data = dataResponse.data.values;
    
    // Parse data từ form-encoded hoặc JSON
    let updates;
    if (typeof req.body.rows === 'string') {
      updates = JSON.parse(req.body.rows); // Từ URLSearchParams
    } else {
      updates = req.body.rows; // Từ JSON body
    }
    
    // Xây map mã đơn hàng → chỉ số dòng
    const idCol = headers.indexOf("Mã đơn hàng");
    const rowMap = new Map();
    
    data.slice(1).forEach((row, i) => {
      if (row[idCol]) {
        rowMap.set(row[idCol], i + 2); // +2 vì index 0-based và bỏ header
      }
    });
    
    // Các cột ngày cần parse
    const dateCols = ["Ngày lên đơn", "Ngày đóng hàng"];
    
    const batchUpdates = [];
    
    updates.forEach(obj => {
      const rowIndex = rowMap.get(obj["Mã đơn hàng"]);
      if (rowIndex) {
        // Parse date columns
        dateCols.forEach(col => {
          if (obj[col]) {
            obj[col] = formatDate(obj[col]);
          }
        });
        
        // Tạo mảng giá trị theo đúng thứ tự headers
        const oldRow = data[rowIndex - 1];
        const rowVals = headers.map((h, colIdx) => {
          return obj[h] !== undefined ? obj[h] : (oldRow[colIdx] || '');
        });
        
        batchUpdates.push({
          range: `${sheetName}!A${rowIndex}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex}`,
          values: [rowVals]
        });
      }
    });
    
    // Batch update
    if (batchUpdates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'RAW',
          data: batchUpdates
        }
      });
    }
    
    // Clear cache sau khi update
    cache.clear();
    
    const result = { 
      message: `Cập nhật thành công ${batchUpdates.length} dòng.`,
      updatedRows: batchUpdates.length
    };
    
    const jsonString = JSON.stringify(result);

    if (callbackName) {
      res.set('Content-Type', 'application/javascript');
      res.send(`${callbackName}(${jsonString});`);
    } else {
      res.set('Content-Type', 'application/json');
      res.send(jsonString);
    }
    
  } catch (err) {
    console.error('Error updating Google Sheets:', err);
    const result = { error: err.message };
    const jsonString = JSON.stringify(result);
    
    res.status(500);
    if (callbackName) {
      res.set('Content-Type', 'application/javascript');
      res.send(`${callbackName}(${jsonString});`);
    } else {
      res.set('Content-Type', 'application/json');
      res.send(jsonString);
    }
  }
});

// Route để xóa cache
router.delete('/clearCache', (req, res) => {
  const {cacheKey} = req.query;
  
  if (cacheKey) {
    // Xóa cache của key cụ thể
    if (cache.has(cacheKey)) {
      cache.delete(cacheKey);
      res.json({ success: true, message: `Cache cleared for key: ${cacheKey}` });
    } else {
      res.json({ success: false, message: `Cache key not found: ${cacheKey}` });
    }
  } else {
    // Xóa toàn bộ cache
    cache.clear();
    res.json({ success: true, message: 'All cache cleared' });
  }
});

// Route để xem trạng thái cache
router.get('/cacheStatus', (req, res) => {
  const cacheInfo = [];
  const now = Date.now();
  
  for (const [key, value] of cache.entries()) {
    const timeLeft = Math.max(0, CACHE_DURATION - (now - value.timestamp));
    cacheInfo.push({
      key,
      cached: timeLeft > 0,
      timeLeft: Math.ceil(timeLeft / 1000), // seconds
      dataSize: JSON.stringify(value.data).length
    });
  }
  
  res.json({
    cacheCount: cache.size,
    cacheDuration: CACHE_DURATION / 1000, // seconds
    items: cacheInfo
  });
});


export default router;