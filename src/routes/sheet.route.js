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

  //lấy từ query các giá trị tuNgay, denNgay, sanPham, thiTruong, nvVanDon, ketQuaCheck, dvvc, trangThaiThuTien, nvMkts, nvSale
  const {
    tuNgay,
    denNgay,
    email
  } = req.query;

  // Kiểm tra cache trước
  const now = Date.now();
  const cached = cache.get(cacheKey);
  // if (cached && (now - cached.timestamp) < CACHE_DURATION) {
  //   console.log('Cache hit - returning cached data for:', cacheKey);
  //   const jsonString = JSON.stringify(cached.data);

  //   if (callbackName) {
  //     res.set('Content-Type', 'application/javascript');
  //     res.send(`${callbackName}(${jsonString});`);
  //   } else {
  //     res.set('Content-Type', 'application/json');
  //     res.send(jsonString);
  //   }
  //   return;
  // }

  let result = {}; // Khởi tạo đối tượng result để chứa kết quả cuối cùng

  try {
    // Sử dụng authenticated client đã được cache
    const sheets = await getAuthenticatedClient();

    // 2. Lấy dữ liệu từ Sheet "F3"
    const range = 'F3!A:DA';
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [range, 'Báo cáo vận đơn!A:AL'],
      valueRenderOption: 'FORMATTED_VALUE',
    });
    const values = response.data.valueRanges[0].values;
    const dataBaoCaoVanDon = response.data.valueRanges[1].values;
    const findRowEmail = dataBaoCaoVanDon.find(row => row[1] === email);
    const sanPham = findRowEmail ? findRowEmail[5] : null;
    const thiTruong = findRowEmail ? findRowEmail[6] : null;
    const nvVanDon = findRowEmail ? findRowEmail[8] : null;
    const ketQuaCheck = findRowEmail ? findRowEmail[21] : null;
    const dvvc = findRowEmail ? findRowEmail[35] : null;
    const trangThaiThuTien = findRowEmail ? findRowEmail[27] : null;
    const nvMkts = findRowEmail ? findRowEmail[28] : null;
    const nvSale = findRowEmail ? findRowEmail[29] : null;

    if (!values || values.length < 2) {
      result = { headers: [], rows: [], error: 'Không tìm thấy dữ liệu hoặc dữ liệu không đủ trong Google Sheet F3.' };
    } else {
      const headers = values[0];
      // Giới hạn số lượng rows để tránh memory issues
      let dataRows = values.slice(1);

      // --- Xác định cột để sắp xếp
      const SORT_COL = "Ngày Kế toán đối soát với FFM lần 2";
      const sortIdx = headers.indexOf(SORT_COL);

      //lọc dữ liệu theo query trước khi xử lý

      if (tuNgay) {
        dataRows = dataRows.filter(row => new Date(row[headers.indexOf("Ngày lên đơn")]) >= new Date(tuNgay) || new Date());
      }
      if (denNgay) {
        dataRows = dataRows.filter(row => new Date(row[headers.indexOf("Ngày lên đơn")]) <= new Date(denNgay) || new Date());
      }
      if (sanPham) {
        dataRows = dataRows.filter(row => row[headers.indexOf("Mặt hàng")] === sanPham);
      }
      if (thiTruong) {
        dataRows = dataRows.filter(row => row[headers.indexOf("Khu vực")] === thiTruong);
      }
      if (nvVanDon) {
        const listNvVanDon = nvVanDon.split(',').map(item => item.trim());
        dataRows = dataRows.filter(row => listNvVanDon.includes(row[headers.indexOf("NV Vận đơn")]));
      }
      if (ketQuaCheck) {
        dataRows = dataRows.filter(row => row[headers.indexOf("Kết quả Check")] === ketQuaCheck);
      }
      if (dvvc) {
        const listDvvc = dvvc.split(',').map(item => {
          if (item == 'Trống') return '';
          return item.trim();
        });
        dataRows = dataRows.filter(row => listDvvc.includes(row[headers.indexOf("Đơn vị vận chuyển")]));
      }
      if (trangThaiThuTien) {
        dataRows = dataRows.filter(row => row[headers.indexOf("Trạng thái thu tiền")] === trangThaiThuTien);
      }
      if (nvMkts) {
        const listNvMkts = nvMkts.split(',').map(item => item.trim());
        dataRows = dataRows.filter(row => listNvMkts.includes(row[headers.indexOf("Nhân viên Marketing")]));
      }
      if (nvSale) {
        const listNvSale = nvSale.split(',').map(item => item.trim());
        dataRows = dataRows.filter(row => listNvSale.includes(row[headers.indexOf("Nhân viên Sale")]));
      }

      //url test
      //localhost:3000/api/sheet/getData?tuNgay=2023-01-01&denNgay=2023-12-31&sanPham=SP001&thiTruong=Hanoi&nvVanDon=NV001&ketQuaCheck=Pass&dvvc=DVVC001&trangThaiThuTien=Paid&nvMkts=NV_MKT001, NV_MKT002&nvSale=NV_SALE001, NV_SALE002

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

      // --- Tối ưu mapping với for loop thay vì map + forEach
      const resultRows = new Array(dataRows.length); // Pre-allocate array

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const obj = {};
        const rowLength = Math.min(row.length, headers.length);

        for (let ci = 0; ci < rowLength; ci++) {
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

        resultRows[i] = obj;
      }

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
  const { sheetName, rangeSheet, spreadsheetId } = req.query;

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

      // TỐI ƯU: Dùng for loops thuần thay vì map + forEach
      const data = new Array(dataRows.length); // Pre-allocate array
      const headersLength = headers.length;

      for (let i = 0; i < dataRows.length; i++) {
        const obj = {};
        const row = dataRows[i];

        // Dùng for thay vì forEach để tránh function call overhead
        for (let j = 0; j < headersLength; j++) {
          obj[headers[j]] = row[j] || ''; // Thêm fallback cho undefined
        }

        data[i] = obj;
      }

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
            const date = new Date(obj[col]);
            //mm/dd/yyyy
            obj[col] = date.toLocaleDateString('en-US');
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
  const { cacheKey } = req.query;

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
    const COL_ID = "Mã đơn hàng";
    const COL_SHIP = "Trạng thái giao hàng NB";
    const COL_CASH = "Trạng thái thu tiền";
    const idColIdx = headers.indexOf(COL_ID);
    const shipColIdx = headers.indexOf(COL_SHIP);
    const cashColIdx = headers.indexOf(COL_CASH);

    const missing = [];
    if (idColIdx === -1) missing.push(COL_ID);
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
        dataPayload.push({ range: `${sheetName}!${a1}`, values: [[obj[COL_SHIP]]] });
        updatedCells++;
      }
      if (Object.prototype.hasOwnProperty.call(obj, COL_CASH)) {
        const a1 = numberToColumnLetter(cashColIdx + 1) + r;
        dataPayload.push({ range: `${sheetName}!${a1}`, values: [[obj[COL_CASH]]] });
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

router.post('/updateCell', async (req, res) => {
  const callbackName = req.query.callback;

  try {
    let cellData;
    if (typeof req.body.data === 'string') {
      cellData = JSON.parse(req.body.data);
    } else {
      cellData = req.body.data || req.body;
    }

    const {
      sheetName = 'F3',
      idValue,
      columnName,
      value
    } = cellData;

    if (!idValue || !columnName || value === undefined) {
      throw new Error("Thiếu: idValue, columnName, value");
    }

    const sheets = await getAuthenticatedClient();

    // Lấy tất cả data một lần
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:ZZ`,
    });

    const allValues = response.data.values || [];
    if (allValues.length < 2) {
      throw new Error(`Sheet ${sheetName} không có dữ liệu`);
    }

    const headers = allValues[0];
    const dataRows = allValues.slice(1);

    // Tìm vị trí với for loop tối ưu
    const targetColIdx = headers.indexOf(columnName);
    const idColIdx = headers.indexOf("Mã đơn hàng");

    if (targetColIdx === -1) throw new Error(`Không tìm thấy cột: ${columnName}`);
    if (idColIdx === -1) throw new Error(`Không tìm thấy cột ID`);

    // Tìm row với for loop và early exit
    let targetRow = -1;
    const searchId = String(idValue);

    for (let i = 0; i < dataRows.length; i++) {
      if (String(dataRows[i][idColIdx] || '') === searchId) {
        targetRow = i + 2; // +2 for header and 0-based
        break; // EARLY EXIT - quan trọng!
      }
    }

    if (targetRow === -1) {
      throw new Error(`Không tìm thấy ID: ${idValue}`);
    }

    // Update cell
    const cellAddress = `${numberToColumnLetter(targetColIdx + 1)}${targetRow}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${cellAddress}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]]
      }
    });

    // Clear cache
    cache.clear();

    const result = { success: true, cell: cellAddress, value: value };
    const jsonString = JSON.stringify(result);

    if (callbackName) {
      res.set('Content-Type', 'application/javascript');
      res.send(`${callbackName}(${jsonString});`);
    } else {
      res.set('Content-Type', 'application/json');
      res.send(jsonString);
    }

  } catch (error) {
    const result = { success: false, error: error.message };
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

// Thêm constants cho các spreadsheet IDs
const NHAN_SU_SPREADSHEET_ID = "1Cl-56By1eYFB4G7ITuG0IQhH39ITwo0AkZPFvsLfo54"; // ID của sheet Nhân sự
const NHAN_SU_SHEET_NAME = "Nhân sự"; // Tên sheet Nhân sự

/**
 * Chuyển đổi số sê-ri của Google Sheets thành đối tượng Date của JavaScript.
 * @param {number} serialNumber Số sê-ri ngày tháng từ Google Sheets.
 * @return {Date} Đối tượng Date tương ứng.
 */
const serialToDate = (serialNumber) => {
  // 25569 là số ngày chênh lệch giữa mốc 30/12/1899 của Sheets
  // và mốc 01/01/1970 của JavaScript.
  const daysOffset = 25569;
  const jsTimestamp = (serialNumber - daysOffset) * 24 * 60 * 60 * 1000;
  return new Date(jsTimestamp);
};

/**
 * Chuyển đổi số sê-ri thành ISO string
 * @param {number} serialNumber Số sê-ri ngày tháng từ Google Sheets.
 * @return {string} ISO string của ngày.
 */
const getISOString = (serialNumber) => {
  if (!serialNumber) return "";
  const dateObject = serialToDate(serialNumber);
  return dateObject.toISOString();
};

/**
 * Hàm lấy thông tin nhân sự theo email
 * @param {string} email Email cần tìm
 * @param {Array<Array<any>>} data Dữ liệu nhân sự
 * @returns {Object} Thông tin nhân sự
 */
const getNhanSuInfoByEmailPro = (email, data) => {
  if (!email || !data || data.length < 2) return {}; // Kiểm tra data hợp lệ
  try {
    const headers = data[0];
    const rows = data.slice(1);

    // LƯU Ý: Hãy thay "Chức vụ" bằng đúng tên cột trong Sheet của bạn
    const chucVuHeaderName = "Vị trí"; // <-- Thay đổi ở đây nếu cần

    const emailCol = headers.indexOf("email");
    const teamCol = headers.indexOf("Team");
    const tenCol = headers.indexOf("Họ Và Tên");
    const idNsCol = headers.indexOf("id");
    const chucVuCol = headers.indexOf(chucVuHeaderName);

    // Thêm chucVuCol vào điều kiện kiểm tra
    if ([emailCol, teamCol, tenCol, idNsCol, chucVuCol].some(index => index === -1)) {
      console.error("Không tìm thấy một hoặc nhiều cột cần thiết. Hãy kiểm tra lại tên cột.");
      return {};
    }

    for (const row of rows) {
      if (row[emailCol] === email) {
        return {
          Team: row[teamCol],
          'Tên': row[tenCol],
          id_NS: row[idNsCol],
          'Chức vụ': row[chucVuCol] || '' // Trả về chuỗi rỗng nếu ô chức vụ bị trống
        };
      }
    }
    return {}; // Trả về object rỗng nếu không tìm thấy email
  } catch (e) {
    console.error("Lỗi khi lấy thông tin nhân sự: " + e.message);
    return {};
  }
};

/**
 * Hàm xử lý mặc định cho các tableName khác
 * @param {Array<Array<any>>} values - Dữ liệu thô từ trang tính.
 * @param {Array<Array<any>>} dataNs - Dữ liệu nhân sự (nếu có).
 * @returns {Object} - Đối tượng chứa dữ liệu đã được xử lý.
 */
const processDefault = (values, dataNs = null) => {
  if (values.length === 0) {
    return { headers: [], data: [] };
  }

  const headers = values[0];
  const rows = values.slice(1);
  const data = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h === 'Ngày') {
        obj[h] = getISOString(row[i] || "");
      } else {
        obj[h] = row[i] || "";
      }
    });
    return obj;
  });

  return { headers, data };
};

/**
 * Hàm xử lý riêng cho tableName "Báo cáo MKT"
 * @param {Array<Array<any>>} values - Dữ liệu thô từ trang tính (bao gồm cả hàng tiêu đề).
 * @param {Array<Array<any>>} dataNs - Dữ liệu nhân sự.
 * @param {Array<Array<any>>} dataOrder - Dữ liệu đơn hàng.
 * @returns {Object} - Đối tượng chứa dữ liệu đã được xử lý.
 */
const processMktReport = (values, dataNs, dataOrder) => {
  if (values.length === 0) {
    return { headers: [], data: [] };
  }

  const headerOrders = dataOrder[0];
  const ngayOrderIndex = headerOrders.indexOf("Ngày lên đơn");
  const nhanVienOrderIndex = headerOrders.indexOf("Nhân viên Marketing");
  const matHangOrderIndex = headerOrders.indexOf("Mặt hàng");
  const khuVucOrderIndex = headerOrders.indexOf("Khu vực");
  const ketQuaCheckOrderIndex = headerOrders.indexOf("Kết quả Check");
  const tongTienOrderIndex = headerOrders.indexOf("Tổng tiền VNĐ");

  const headers = values[0];
  const rows = values.slice(1);

  // Set để theo dõi các tổ hợp đã được xử lý
  const processedKeys = new Set();

  const data = rows.map(row => {
    let obj = {};
    // 1. Tạo đối tượng cơ bản từ dữ liệu hàng hiện tại
    headers.forEach((h, i) => {
      if (h === 'Ngày') {
        obj[h] = getISOString(row[i] || "");
      } else {
        obj[h] = row[i] || "";
      }
      if (h === 'Email') {
        const info = getNhanSuInfoByEmailPro(row[i], dataNs);
        obj['Chức vụ'] = info['Chức vụ'];
      }
    });

    // 2. Tạo một khóa duy nhất từ các cột được chỉ định
    const key = `${obj['Tên']}|${obj['Ngày']}|${obj['ca']}|${obj['Sản_phẩm']}|${obj['Thị_trường']}`;

    // 3. Kiểm tra xem khóa này đã được xử lý chưa
    if (processedKeys.has(key)) {
      // Nếu đã xử lý, bỏ qua phần tính toán và trả về đối tượng đã có giá trị cũ
      // Các giá trị cũ đã được điền ở bước 1
    } else {
      // Nếu đây là lần đầu tiên gặp khóa này
      // Đánh dấu là đã xử lý
      processedKeys.add(key);

      // Thực hiện các phép tính toán tốn kém
      const listOrder = dataOrder.filter((item, index) => {
        const date = serialToDate(row[3]); // Giả sử cột 'Ngày' ở index 3
        date.setHours(0, 0, 0, 0);

        const orderDate = new Date(item[ngayOrderIndex]);
        orderDate.setHours(0, 0, 0, 0);

        return orderDate.getTime() === date.getTime() &&
          item[nhanVienOrderIndex] === obj['Tên'] &&
          item[matHangOrderIndex] === obj['Sản_phẩm'] &&
          item[khuVucOrderIndex] === obj['Thị_trường'];
      });

      // Cập nhật các trường tính toán vào đối tượng
      obj['Số đơn thực tế'] = listOrder.length;
      // console.log('listOrder:', JSON.stringify(listOrder));

      obj['Doanh thu chốt thực tế'] = listOrder.reduce((sum, item) => sum + (item[tongTienOrderIndex] || 0), 0);
      obj['Doanh số đi thực tế'] = listOrder.reduce((sum, item) => {
        return sum + (item[ketQuaCheckOrderIndex] === 'OK' ? (item[tongTienOrderIndex] || 0) : 0);
      }, 0);
      obj['Doanh số hoàn hủy thực tế'] = listOrder.reduce((sum, item) => {
        return sum + (item[ketQuaCheckOrderIndex] === 'Huỷ' || item[ketQuaCheckOrderIndex] === 'Hoàn' ? (item[tongTienOrderIndex] || 0) : 0);
      }, 0);
      obj['Số đơn hoàn hủy thực tế'] = listOrder.reduce((sum, item) => {
        return sum + (item[ketQuaCheckOrderIndex] === 'Huỷ' || item[ketQuaCheckOrderIndex] === 'Hoàn' ? 1 : 0);
      }, 0);
      obj['Doanh số sau hoàn hủy thực tế'] = listOrder.reduce((sum, item) => {
        return sum + (item[ketQuaCheckOrderIndex] !== 'Huỷ' && item[ketQuaCheckOrderIndex] !== 'Hoàn' ? (item[tongTienOrderIndex] || 0) : 0);
      }, 0);
      obj.listOrder = listOrder;
    }

    return obj;
  });

  const newHeaders = [
    'Số đơn thực tế',
    'Doanh thu chốt thực tế',
    'Doanh số đi thực tế',
    'Doanh số hoàn hủy thực tế',
    'Số đơn hoàn hủy thực tế',
    'Doanh số sau hoàn hủy thực tế'
  ];

  // Đảm bảo các headers mới được thêm vào đúng cách
  const finalHeaders = [...headers];
  newHeaders.forEach(h => {
    if (!finalHeaders.includes(h)) {
      finalHeaders.push(h);
    }
  });

  return { headers: finalHeaders, data };
};

/**
 * Hàm xử lý riêng cho tableName "Báo cáo sale"
 * @param {Array<Array<any>>} values - Dữ liệu thô từ trang tính (bao gồm cả hàng tiêu đề).
 * @param {Array<Array<any>>} dataNs - Dữ liệu nhân sự.
 * @param {Array<Array<any>>} dataOrder - Dữ liệu đơn hàng.
 * @returns {Object} - Đối tượng chứa dữ liệu đã được xử lý.
 */
const processSalesReport = (values, dataNs, dataOrder) => {
  if (values.length === 0) {
    return { headers: [], data: [] };
  }

  const headerOrders = dataOrder[0];
  const ngayOrderIndex = headerOrders.indexOf("Ngày lên đơn");
  const nhanVienOrderIndex = headerOrders.indexOf("Nhân viên Sale");
  const matHangOrderIndex = headerOrders.indexOf("Mặt hàng");
  const khuVucOrderIndex = headerOrders.indexOf("Khu vực");
  const ketQuaCheckOrderIndex = headerOrders.indexOf("Kết quả Check");
  const tongTienOrderIndex = headerOrders.indexOf("Tổng tiền VNĐ");

  const headers = values[0];
  const rows = values.slice(1);

  const data = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      if (h === 'Ngày') {
        obj[h] = getISOString(row[i] || "");
      } else {
        obj[h] = row[i] || "";
      }
      if (h === 'Email') {
        const info = getNhanSuInfoByEmailPro(row[i], dataNs);
        obj['Chức vụ'] = info['Chức vụ'];
      }
    });

    const listOrder = dataOrder.filter((item, index) => {
      const date = serialToDate(row[3]);
      date.setHours(0, 0, 0, 0);

      const orderDate = new Date(item[ngayOrderIndex]);
      orderDate.setHours(0, 0, 0, 0);

      return orderDate.getTime() === date.getTime() &&
        item[nhanVienOrderIndex] === obj['Tên'] &&
        item[matHangOrderIndex] === obj['Sản phẩm'] &&
        item[khuVucOrderIndex] === obj['Thị trường'];
    });

    obj['Số đơn thực tế'] = listOrder.length;
    // console.log('listOrder:', JSON.stringify(listOrder));

    obj['Doanh thu chốt thực tế'] = listOrder.reduce((sum, item) => sum + (item[tongTienOrderIndex] || 0), 0);
    obj['Doanh số đi thực tế'] = listOrder.reduce((sum, item) => {
      return sum + (item[ketQuaCheckOrderIndex] === 'OK' ? (item[tongTienOrderIndex] || 0) : 0);
    }, 0);
    obj['Doanh số hoàn hủy thực tế'] = listOrder.reduce((sum, item) => {
      return sum + (item[ketQuaCheckOrderIndex] === 'Huỷ' || item[ketQuaCheckOrderIndex] === 'Hoàn' ? (item[tongTienOrderIndex] || 0) : 0);
    }, 0);
    obj['Số đơn hoàn hủy thực tế'] = listOrder.reduce((sum, item) => {
      return sum + (item[ketQuaCheckOrderIndex] === 'Huỷ' || item[ketQuaCheckOrderIndex] === 'Hoàn' ? 1 : 0);
    }, 0);
    obj['Doanh số sau hoàn hủy thực tế'] = listOrder.reduce((sum, item) => {
      return sum + (item[ketQuaCheckOrderIndex] !== 'Huỷ' && item[ketQuaCheckOrderIndex] !== 'Hoàn' ? (item[tongTienOrderIndex] || 0) : 0);
    }, 0);

    return obj;
  });

  return {
    headers: [...headers, 'Số đơn thực tế', 'Doanh thu chốt thực tế', 'Doanh số đi thực tế', 'Doanh số hoàn hủy thực tế', 'Số đơn hoàn hủy thực tế', 'Doanh số sau hoàn hủy thực tế'],
    data
  };
};

// Thêm route mới để xử lý báo cáo
router.get('/getReport', async (req, res) => {
  const callbackName = req.query.callback;
  const { tableName, spreadsheetId } = req.query;

  if (!tableName) {
    const result = { error: "Vui lòng cung cấp đủ tham số 'tableName'" };
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

  // Tạo cache key
  const cacheKey = `report_${tableName}_${spreadsheetId || 'default'}`;

  // Kiểm tra cache
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

  try {
    const sheets = await getAuthenticatedClient();
    const targetSpreadsheetId = spreadsheetId || SPREADSHEET_ID;
    const info = {
      'Báo cáo MKT': 'A:AB',
      'Báo cáo Sale': 'A:Y'
    }

    // 1. Lấy dữ liệu từ sheet được yêu cầu
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: targetSpreadsheetId,
      range: `${tableName}!${info[tableName] || 'A:Z'}`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const values = response.data.values || [];

    if (values.length === 0) {
      const result = { error: `Không tìm thấy dữ liệu trong sheet ${tableName}` };
      const jsonString = JSON.stringify(result);

      res.status(404);
      if (callbackName) {
        res.set('Content-Type', 'application/javascript');
        res.send(`${callbackName}(${jsonString});`);
      } else {
        res.set('Content-Type', 'application/json');
        res.send(jsonString);
      }
      return;
    }

    let result;
    let dataNs = null;
    let dataOrder = null;

    // Lấy dữ liệu phụ trợ cho các báo cáo đặc biệt
    if (tableName === "Báo cáo MKT" || tableName === "Báo cáo sale") {
      try {
        // Lấy dữ liệu nhân sự
        const nhanSuResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: NHAN_SU_SPREADSHEET_ID,
          range: `${NHAN_SU_SHEET_NAME}!A:Z`,
          valueRenderOption: 'UNFORMATTED_VALUE',
        });
        dataNs = nhanSuResponse.data.values || [];

        // Lấy dữ liệu đơn hàng từ sheet F3
        const orderResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'F3!A:DA',
          valueRenderOption: 'UNFORMATTED_VALUE',
        });
        dataOrder = orderResponse.data.values || [];
      } catch (error) {
        console.error('Error loading supporting data:', error);
        // Tiếp tục với dữ liệu rỗng nếu không lấy được dữ liệu phụ trợ
        dataNs = [];
        dataOrder = [];
      }
    }

    // Xử lý dữ liệu theo loại báo cáo
    switch (tableName) {
      case "Báo cáo MKT":
        result = processMktReport(values, dataNs, dataOrder);
        break;
      case "Báo cáo sale":
        result = processSalesReport(values, dataNs, dataOrder);
        break;
      default:
        result = processDefault(values, dataNs);
        break;
    }

    // Lưu vào cache
    cache.set(cacheKey, {
      data: result,
      timestamp: now
    });
    // console.log('Data cached successfully for:', cacheKey);

    const jsonString = JSON.stringify(result);

    if (callbackName) {
      res.set('Content-Type', 'application/javascript');
      res.send(`${callbackName}(${jsonString});`);
    } else {
      res.set('Content-Type', 'application/json');
      res.send(jsonString);
    }

  } catch (error) {
    console.error('Lỗi khi xử lý báo cáo:', error.message);
    const result = { error: 'Đã xảy ra lỗi khi xử lý báo cáo.', details: error.message };
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


export default router;