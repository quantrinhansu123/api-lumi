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
  const {sheetName, rangeSheet, spreadsheetId} = req.query;

  let result = {}; // Khởi tạo đối tượng result để chứa kết quả cuối cùng

  try {
    // Sử dụng authenticated client đã được cache
    const sheets = await getAuthenticatedClient();

    const range = `${sheetName}!${rangeSheet}`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId ? spreadsheetId : SPREADSHEET_ID,
      range: range,
      valueRenderOption: 'FORMATTED_VALUE', 
    });

    const values = response.data.values;

    if (!values || values.length < 2) {
      result = { headers: [], rows: [], error: `Không tìm thấy dữ liệu hoặc dữ liệu không đủ trong Google Sheet ${sheetName}.` };
    } else {
      const headers = values[0];
      let dataRows = values.slice(1);
      const data = dataRows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
      result = { headers: headers, rows: data };
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

// Thêm hàm helper để convert số cột thành ký tự
function numberToColumnLetter(num) {
  let result = '';
  while (num > 0) {
    num--; // Adjust for 0-based indexing
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

// Thêm route POST để update Google Sheets
router.post('/updateSheets', async (req, res) => {
  const callbackName = req.query.callback;
  
  try {
    const sheets = await getAuthenticatedClient();
    const sheetName = 'F3'; // Hoặc lấy từ req.body.sheetName
    
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
    } else if (Array.isArray(req.body)) {
      updates = req.body; // Nếu body trực tiếp là array
    } else {
      updates = req.body.rows; // Từ JSON body với key 'rows'
    }
    
    // Validate updates
    if (!Array.isArray(updates)) {
      const result = { error: "Dữ liệu updates phải là một mảng" };
      const jsonString = JSON.stringify(result);
      
      res.status(400);
      if (callbackName) {
        res.set('Content-Type', 'application/javascript');
        res.send(`${callbackName}(${jsonString});`);
      } else {
        res.set('Content-Type', 'application/json');
        res.send(jsonString);
      }
      return;
    }
    
    // Xây map mã đơn hàng → chỉ số dòng
    const idCol = headers.indexOf("Mã đơn hàng");
    if (idCol === -1) {
      throw new Error('Không tìm thấy cột "Mã đơn hàng" trong sheet');
    }
    
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
        
        // Sử dụng hàm helper để tính toán range đúng
        const endColumn = numberToColumnLetter(headers.length);
        
        batchUpdates.push({
          range: `${sheetName}!A${rowIndex}:${endColumn}${rowIndex}`,
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
      updatedRows: batchUpdates.length,
      totalRequested: updates.length,
      foundRows: batchUpdates.length
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

// Thêm route POST để insert mã đơn hàng vào sheet MGT nội bộ
router.post('/insertMGT', async (req, res) => {
  const callbackName = req.query.callback;
  const SHEET_NAME = "MGT nội bộ"; // tên sheet bạn đang dùng
  const COL_INDEX = 1; // chỉ có 1 cột duy nhất (A = 1)
  
  try {
    const sheets = await getAuthenticatedClient();
    
    // Parse data từ form-encoded hoặc JSON
    let payload;
    if (typeof req.body.data === 'string') {
      payload = { data: JSON.parse(req.body.data) }; // Từ URLSearchParams
    } else if (req.body.data) {
      payload = { data: req.body.data }; // Từ JSON body với key 'data'
    } else {
      payload = req.body; // Toàn bộ body là payload
    }
    
    const maDonList = payload.data;

    if (!Array.isArray(maDonList)) {
      const result = { error: "Dữ liệu đầu vào không hợp lệ" };
      const jsonString = JSON.stringify(result);
      
      res.status(400);
      if (callbackName) {
        res.set('Content-Type', 'application/javascript');
        res.send(`${callbackName}(${jsonString});`);
      } else {
        res.set('Content-Type', 'application/json');
        res.send(jsonString);
      }
      return;
    }

    // Lấy danh sách mã hiện có
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`, // Cột A
    });
    
    const existingValues = existingResponse.data.values || [];
    const existing = existingValues.flat(); // Flatten array
    const existingSet = new Set(existing);

    // Lọc mã chưa có
    const newMa = maDonList.filter(ma => !existingSet.has(ma));
    const newRows = newMa.map(ma => [ma]); // chuyển thành mảng 2D

    // Ghi vào sheet nếu có dữ liệu mới
    if (newRows.length > 0) {
      const lastRow = existingValues.length;
      const startRow = lastRow + 1;
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${startRow}:A${startRow + newRows.length - 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: newRows
        }
      });
    }

    // Clear cache cho sheet này nếu có
    const cacheKey = `${SHEET_NAME}_A:A`;
    if (cache.has(cacheKey)) {
      cache.delete(cacheKey);
    }
//response trả về chi tiết nhé, comment cho tôi biết đó là những thông tin gì
    const result = {
      inserted: newRows.length, // Số lượng mã đơn hàng mới được thêm
      skipped: maDonList.length - newRows.length, // Số lượng mã đơn hàng đã tồn tại
      details: maDonList.filter(ma => !newMa.includes(ma)), // Chi tiết các mã đơn hàng đã tồn tại
      total: maDonList.length, // Tổng số mã đơn hàng
      rows: newRows, // Dữ liệu các hàng mới
      success: true
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
    console.error('Error inserting to MGT sheet:', err);
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
router.get('/clearCache', (req, res) => {
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

router.post('/quickUpdateF3', async (req, res) => {
  const callbackName = req.query.callback;
  try {
    // Đọc field 'rows' từ form-urlencoded
    let updates;
    if (typeof req.body.rows === 'string') {
      updates = JSON.parse(req.body.rows);
    } else {
      throw new Error("Thiếu field 'rows' (x-www-form-urlencoded).");
    }
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("'rows' rỗng.");
    }

    const sheets = await getAuthenticatedClient();
    const sheetName = 'F3';

    // Lấy headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:1`,
    });
    const headers = headerResponse.data.values[0];

    // Xác định index các cột
    const COL_ID   = "Mã đơn hàng";
    const COL_SHIP = "Trạng thái giao hàng NB";
    const COL_CASH = "Trạng thái thu tiền";
    const idColIdx   = headers.indexOf(COL_ID);
    const shipColIdx = headers.indexOf(COL_SHIP);
    const cashColIdx = headers.indexOf(COL_CASH);

    const missing = [];
    if (idColIdx   === -1) missing.push(COL_ID);
    if (shipColIdx === -1) missing.push(COL_SHIP);
    if (cashColIdx === -1) missing.push(COL_CASH);
    if (missing.length) {
      throw new Error(`Thiếu cột bắt buộc: ${missing.join(", ")}`);
    }

    // Đọc duy nhất cột ID để lập map
    const idResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${numberToColumnLetter(idColIdx + 1)}2:${numberToColumnLetter(idColIdx + 1)}`,
    });
    const idValues = idResponse.data.values || [];
    const rowMap = new Map();
    idValues.forEach((row, i) => {
      const v = row[0];
      if (v) rowMap.set(String(v), i + 2); // +2 vì header ở dòng 1
    });

    // Gom các ô cần ghi
    const dataPayload = [];
    const notFound = [];
    let updatedCells = 0;

    updates.forEach((obj) => {
      const orderId = obj[COL_ID];
      if (!orderId) return;
      const r = rowMap.get(String(orderId));
      if (!r) { notFound.push(orderId); return; }
      if (Object.prototype.hasOwnProperty.call(obj, COL_SHIP)) {
        const a1 = numberToColumnLetter(shipColIdx + 1) + r;
        dataPayload.push({ range: `${sheetName}!${a1}`, values: [[ obj[COL_SHIP] ]] });
        updatedCells++;
      }
      if (Object.prototype.hasOwnProperty.call(obj, COL_CASH)) {
        const a1 = numberToColumnLetter(cashColIdx + 1) + r;
        dataPayload.push({ range: `${sheetName}!${a1}`, values: [[ obj[COL_CASH] ]] });
        updatedCells++;
      }
    });

    if (dataPayload.length === 0) {
      const result = { updated_cells: 0, not_found: notFound, message: "Không có ô nào cần cập nhật." };
      const jsonString = JSON.stringify(result);
      res.status(200);
      if (callbackName) {
        res.set('Content-Type', 'application/javascript');
        res.send(`${callbackName}(${jsonString});`);
      } else {
        res.set('Content-Type', 'application/json');
        res.send(jsonString);
      }
      return;
    }

    // Batch update 1 lần
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data: dataPayload
      }
    });

    // Clear cache nếu cần
    cache.clear();

    const result = {
      updated_cells: updatedCells,
      not_found: notFound,
      message: `Đã ghi ${updatedCells} ô${notFound.length ? `; không tìm thấy ${notFound.length} mã` : ""}.`
    };
    const jsonString = JSON.stringify(result);
    res.status(200);
    if (callbackName) {
      res.set('Content-Type', 'application/javascript');
      res.send(`${callbackName}(${jsonString});`);
    } else {
      res.set('Content-Type', 'application/json');
      res.send(jsonString);
    }
  } catch (err) {
    const result = { error: err.message };
    const jsonString = JSON.stringify(result);
    res.status(400);
    if (callbackName) {
      res.set('Content-Type', 'application/javascript');
      res.send(`${callbackName}(${jsonString});`);
    } else {
      res.set('Content-Type', 'application/json');
      res.send(jsonString);
    }
  }
});


export default router;