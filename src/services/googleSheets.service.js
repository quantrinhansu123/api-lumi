import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { DataValidator, SHEET_SCHEMAS } from '../models/sheet.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình Google Sheets
const KEYFILEPATH = path.join(__dirname, '../..', 'sheetCredentials.json');
const SPREADSHEET_ID = '1rI9cHBNlI2Dc-d6VF6zdKiUagBh-VPFrWdddPysuSmo';

class GoogleSheetsService {
  constructor() {
    this.authClient = null;
    this.sheetsAPI = null;
  }

  /**
   * Tạo authenticated client để kết nối Google Sheets API
   */
  async getAuthenticatedClient() {
    if (!this.authClient) {
      const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      this.authClient = await auth.getClient();
      this.sheetsAPI = google.sheets({ version: 'v4', auth: this.authClient });
    }
    return this.sheetsAPI;
  }

  /**
   * Lấy thông tin về spreadsheet
   */
  async getSpreadsheetInfo() {
    try {
      const sheets = await this.getAuthenticatedClient();
      const response = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      
      return {
        title: response.data.properties.title,
        sheets: response.data.sheets.map(sheet => ({
          sheetId: sheet.properties.sheetId,
          title: sheet.properties.title,
          gridProperties: sheet.properties.gridProperties
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get spreadsheet info: ${error.message}`);
    }
  }

  /**
   * Tạo sheet mới
   */
  async createSheet(sheetName) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      // Kiểm tra schema có tồn tại không
      if (!SHEET_SCHEMAS[sheetName]) {
        throw new Error(`Schema not found for sheet: ${sheetName}`);
      }

      const request = {
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      };

      const response = await sheets.spreadsheets.batchUpdate(request);
      const newSheetId = response.data.replies[0].addSheet.properties.sheetId;

      // Thêm headers vào sheet mới
      await this.setHeaders(sheetName);

      return {
        sheetId: newSheetId,
        title: sheetName,
        message: 'Sheet created successfully with headers'
      };
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new Error(`Sheet "${sheetName}" already exists`);
      }
      throw new Error(`Failed to create sheet: ${error.message}`);
    }
  }

  /**
   * Xóa sheet
   */
  async deleteSheet(sheetName) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      // Lấy thông tin về spreadsheet để tìm sheetId
      const spreadsheetInfo = await this.getSpreadsheetInfo();
      const sheet = spreadsheetInfo.sheets.find(s => s.title === sheetName);
      
      if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      const request = {
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            deleteSheet: {
              sheetId: sheet.sheetId
            }
          }]
        }
      };

      await sheets.spreadsheets.batchUpdate(request);
      return { message: `Sheet "${sheetName}" deleted successfully` };
    } catch (error) {
      throw new Error(`Failed to delete sheet: ${error.message}`);
    }
  }

  /**
   * Thiết lập headers cho sheet theo schema
   */
  async setHeaders(sheetName) {
    try {
      const sheets = await this.getAuthenticatedClient();
      const headers = DataValidator.getHeaders(sheetName);

      const request = {
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:${this.getColumnLetter(headers.length)}1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      };

      await sheets.spreadsheets.values.update(request);
      return { message: 'Headers set successfully' };
    } catch (error) {
      throw new Error(`Failed to set headers: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả dữ liệu từ một sheet
   */
  async getAllData(sheetName) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:ZZ`, // Lấy tất cả dữ liệu
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return [];
      }

      // Bỏ qua header row (row đầu tiên)
      const dataRows = rows.slice(1);
      
      return dataRows.map(row => DataValidator.arrayToData(row, sheetName));
    } catch (error) {
      throw new Error(`Failed to get data from sheet "${sheetName}": ${error.message}`);
    }
  }

  /**
   * Lấy dữ liệu theo range cụ thể
   */
  async getDataByRange(sheetName, range) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!${range}`,
      });

      const rows = response.data.values || [];
      return rows.map(row => DataValidator.arrayToData(row, sheetName));
    } catch (error) {
      throw new Error(`Failed to get data by range: ${error.message}`);
    }
  }

  /**
   * Thêm một dòng dữ liệu mới
   */
  async addRow(sheetName, rowData) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      // Validate dữ liệu trước khi thêm
      const validatedData = DataValidator.validateRow(rowData, sheetName);
      const rowArray = DataValidator.dataToArray(validatedData, sheetName);

      const request = {
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:A`, // Append to the end
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [rowArray]
        }
      };

      const response = await sheets.spreadsheets.values.append(request);
      
      return {
        updatedRows: response.data.updates.updatedRows,
        updatedRange: response.data.updates.updatedRange,
        data: validatedData,
        message: 'Row added successfully'
      };
    } catch (error) {
      throw new Error(`Failed to add row: ${error.message}`);
    }
  }

  /**
   * Thêm nhiều dòng dữ liệu
   */
  async addMultipleRows(sheetName, rowsData) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      // Validate tất cả dữ liệu trước khi thêm
      const validatedRows = rowsData.map(rowData => {
        const validatedData = DataValidator.validateRow(rowData, sheetName);
        return DataValidator.dataToArray(validatedData, sheetName);
      });

      const request = {
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:A`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: validatedRows
        }
      };

      const response = await sheets.spreadsheets.values.append(request);
      
      return {
        updatedRows: response.data.updates.updatedRows,
        updatedRange: response.data.updates.updatedRange,
        addedCount: validatedRows.length,
        message: `${validatedRows.length} rows added successfully`
      };
    } catch (error) {
      throw new Error(`Failed to add multiple rows: ${error.message}`);
    }
  }

  /**
   * Cập nhật một dòng dữ liệu theo row index
   */
  async updateRowByIndex(sheetName, rowIndex, rowData) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      // Validate dữ liệu
      const validatedData = DataValidator.validateRow(rowData, sheetName);
      const rowArray = DataValidator.dataToArray(validatedData, sheetName);

      // rowIndex + 2 vì: +1 cho 1-based indexing, +1 để bỏ qua header
      const actualRowNumber = rowIndex + 2;
      const range = `${sheetName}!A${actualRowNumber}:${this.getColumnLetter(rowArray.length)}${actualRowNumber}`;

      const request = {
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        resource: {
          values: [rowArray]
        }
      };

      const response = await sheets.spreadsheets.values.update(request);
      
      return {
        updatedRange: response.data.updatedRange,
        updatedRows: response.data.updatedRows,
        data: validatedData,
        message: 'Row updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update row: ${error.message}`);
    }
  }

  /**
   * Tìm và cập nhật dòng dữ liệu theo điều kiện
   */
  async updateRowByCondition(sheetName, searchColumn, searchValue, newRowData) {
    try {
      const allData = await this.getAllData(sheetName);
      const rowIndex = allData.findIndex(row => row[searchColumn] === searchValue);
      
      if (rowIndex === -1) {
        throw new Error(`Row with ${searchColumn} = "${searchValue}" not found`);
      }

      return await this.updateRowByIndex(sheetName, rowIndex, newRowData);
    } catch (error) {
      throw new Error(`Failed to update row by condition: ${error.message}`);
    }
  }

  /**
   * Xóa dòng dữ liệu theo row index
   */
  async deleteRowByIndex(sheetName, rowIndex) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      // Lấy sheetId
      const spreadsheetInfo = await this.getSpreadsheetInfo();
      const sheet = spreadsheetInfo.sheets.find(s => s.title === sheetName);
      
      if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      // rowIndex + 1 cho 1-based indexing, +1 để bỏ qua header
      const actualRowNumber = rowIndex + 1;

      const request = {
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheet.sheetId,
                dimension: 'ROWS',
                startIndex: actualRowNumber,
                endIndex: actualRowNumber + 1
              }
            }
          }]
        }
      };

      await sheets.spreadsheets.batchUpdate(request);
      
      return { message: `Row ${rowIndex + 2} deleted successfully` };
    } catch (error) {
      throw new Error(`Failed to delete row: ${error.message}`);
    }
  }

  /**
   * Tìm và xóa dòng dữ liệu theo điều kiện
   */
  async deleteRowByCondition(sheetName, searchColumn, searchValue) {
    try {
      const allData = await this.getAllData(sheetName);
      const rowIndex = allData.findIndex(row => row[searchColumn] === searchValue);
      
      if (rowIndex === -1) {
        throw new Error(`Row with ${searchColumn} = "${searchValue}" not found`);
      }

      return await this.deleteRowByIndex(sheetName, rowIndex);
    } catch (error) {
      throw new Error(`Failed to delete row by condition: ${error.message}`);
    }
  }

  /**
   * Tìm kiếm dữ liệu theo điều kiện
   */
  async searchRows(sheetName, searchColumn, searchValue, exactMatch = true) {
    try {
      const allData = await this.getAllData(sheetName);
      
      return allData.filter(row => {
        const cellValue = row[searchColumn]?.toString() || '';
        const searchStr = searchValue.toString();
        
        return exactMatch 
          ? cellValue === searchStr
          : cellValue.toLowerCase().includes(searchStr.toLowerCase());
      });
    } catch (error) {
      throw new Error(`Failed to search rows: ${error.message}`);
    }
  }

  /**
   * Lấy số dòng có dữ liệu
   */
  async getRowCount(sheetName) {
    try {
      const allData = await this.getAllData(sheetName);
      return allData.length;
    } catch (error) {
      throw new Error(`Failed to get row count: ${error.message}`);
    }
  }

  /**
   * Clear tất cả dữ liệu (giữ lại headers)
   */
  async clearAllData(sheetName) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      const request = {
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2:ZZ`, // Bắt đầu từ row 2 để giữ headers
      };

      await sheets.spreadsheets.values.clear(request);
      return { message: 'All data cleared successfully (headers preserved)' };
    } catch (error) {
      throw new Error(`Failed to clear data: ${error.message}`);
    }
  }

  /**
   * Utility: Convert số cột thành chữ cái (A, B, C, ..., AA, AB, ...)
   */
  getColumnLetter(columnNumber) {
    let result = '';
    while (columnNumber > 0) {
      columnNumber--;
      result = String.fromCharCode(65 + (columnNumber % 26)) + result;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return result;
  }

  /**
   * Lấy schema của một sheet
   */
  getSheetSchema(sheetName) {
    return SHEET_SCHEMAS[sheetName] || null;
  }

  /**
   * Lấy danh sách tất cả schemas có sẵn
   */
  getAvailableSchemas() {
    return Object.keys(SHEET_SCHEMAS);
  }
}

export default GoogleSheetsService;
