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
    this.isAuthenticated = false;
    this.authPromise = null; // Để tránh multiple authentication calls
  }

  /**
   * Tạo authenticated client để kết nối Google Sheets API - OPTIMIZED
   */
  async getAuthenticatedClient() {
    // Nếu đã có client và đã authenticated, return ngay
    if (this.authClient && this.sheetsAPI && this.isAuthenticated) {
      return this.sheetsAPI;
    }

    // Nếu đang trong quá trình authenticate, chờ
    if (this.authPromise) {
      await this.authPromise;
      return this.sheetsAPI;
    }

    // Tạo promise để authenticate
    this.authPromise = this.performAuthentication();
    await this.authPromise;
    this.authPromise = null;

    return this.sheetsAPI;
  }

  /**
   * Thực hiện authentication một lần
   */
  async performAuthentication() {
    try {
      console.log('🔑 Authenticating with Google Sheets API...');
      const startTime = Date.now();
      
      const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.authClient = await auth.getClient();
      this.sheetsAPI = google.sheets({ version: 'v4', auth: this.authClient });
      this.isAuthenticated = true;
      
      const endTime = Date.now();
      console.log(`✅ Authentication completed in ${endTime - startTime}ms`);
      
    } catch (error) {
      this.isAuthenticated = false;
      this.authClient = null;
      this.sheetsAPI = null;
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin spreadsheet
   */
  async getSpreadsheetInfo() {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      const response = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
      });

      return {
        title: response.data.properties.title,
        sheets: response.data.sheets.map(sheet => ({
          id: sheet.properties.sheetId,
          title: sheet.properties.title,
          gridProperties: sheet.properties.gridProperties
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get spreadsheet info: ${error.message}`);
    }
  }

  /**
   * Calculate Smart Range based on requested fields
   */
  calculateSmartRange(sheetName, requestedFields = null) {
    const schema = SHEET_SCHEMAS[sheetName];
    if (!schema) {
      return { fullRange: `${sheetName}!A:Z`, batchRanges: null };
    }

    // Nếu không có fields cụ thể, lấy tất cả
    if (!requestedFields) {
      const lastColumn = this.getColumnLetter(schema.columns.length);
      return { 
        fullRange: `${sheetName}!A1:${lastColumn}`, // Lấy toàn bộ data
        batchRanges: null,
        columns: schema.columns.map((col, index) => ({
          key: col.key,
          index: index,
          letter: this.getColumnLetter(index + 1),
          type: col.type
        }))
      };
    }

    // Tìm các cột được yêu cầu trong schema
    const requestedColumns = [];
    requestedFields.forEach(field => {
      const colIndex = schema.columns.findIndex(col => col.key === field);
      if (colIndex !== -1) {
        requestedColumns.push({
          key: field,
          index: colIndex,
          letter: this.getColumnLetter(colIndex + 1),
          type: schema.columns[colIndex].type
        });
      } else {
        console.log(`⚠️ Field "${field}" not found in schema`);
      }
    });

    console.log(`🔍 Requested columns:`, requestedColumns.map(c => `${c.key} -> ${c.letter} (index: ${c.index})`));

    if (requestedColumns.length === 0) {
      return { fullRange: `${sheetName}!A1:A`, batchRanges: null }; // Lấy toàn bộ cột A
    }

    // Kiểm tra xem các cột có liền kề không
    const sortedColumns = requestedColumns.sort((a, b) => a.index - b.index);
    const isContiguous = this.areColumnsContiguous(sortedColumns);

    console.log(`🔍 Column analysis:`, {
      columns: sortedColumns.map(c => `${c.key}:${c.index}`),
      isContiguous: isContiguous
    });

    if (isContiguous) {
      // Các cột liền kề -> sử dụng single range
      const firstCol = sortedColumns[0].letter;
      const lastCol = sortedColumns[sortedColumns.length - 1].letter;
      return {
        fullRange: `${sheetName}!${firstCol}1:${lastCol}`, // Lấy toàn bộ data
        batchRanges: null,
        columns: requestedColumns
      };
    } else {
      // Các cột không liền kề -> sử dụng batchGet
      const batchRanges = sortedColumns.map(col => ({
        range: `${sheetName}!${col.letter}:${col.letter}`, // Format: Sheet!A:A, Sheet!E:E
        key: col.key,
        type: col.type
      }));

      console.log(`🔄 Using BatchGet with ranges:`, batchRanges.map(b => b.range));

      return {
        fullRange: null,
        batchRanges: batchRanges,
        columns: requestedColumns
      };
    }
  }

  /**
   * Kiểm tra các cột có liền kề không
   */
  areColumnsContiguous(sortedColumns) {
    for (let i = 1; i < sortedColumns.length; i++) {
      if (sortedColumns[i].index - sortedColumns[i-1].index !== 1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Lấy tất cả dữ liệu từ một sheet - SMART RANGE VERSION
   */
  async getAllData(sheetName, options = {}) {
    try {
      console.log(`📊 Getting data from ${sheetName} with smart range...`);
      const startTime = Date.now();
      
      const { limit, offset = 0, fields } = options;
      const sheets = await this.getAuthenticatedClient();
      const schema = SHEET_SCHEMAS[sheetName];
      
      if (!schema) {
        throw new Error(`Schema not found for sheet: ${sheetName}`);
      }

      // Calculate smart range
      const rangeInfo = this.calculateSmartRange(sheetName, fields);
      
      let processedData;
      
      if (rangeInfo.batchRanges) {
        // Non-contiguous columns - use batchGet
        console.log(`🔄 Using BatchGet for non-contiguous columns`);
        processedData = await this.getAllDataWithBatch(sheets, rangeInfo, { limit, offset });
      } else {
        // Contiguous columns or full data - use single range
        console.log(`🔄 Using Single Range: ${rangeInfo.fullRange}`);
        processedData = await this.getAllDataWithSingleRange(sheets, rangeInfo, { limit, offset });
      }

      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      console.log(`✅ Smart Range completed in ${queryTime}ms`);
      console.log(`📊 Data size: ${processedData.length} records`);
      
      return {
        data: processedData,
        meta: {
          total: processedData.length,
          queryTime: `${queryTime}ms`,
          optimization: rangeInfo.batchRanges ? 'batch-get' : 'smart-range + field-selection',
          requestedFields: fields,
          rangeUsed: rangeInfo.fullRange || rangeInfo.batchRanges?.map(b => b.range)
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to get data: ${error.message}`);
    }
  }

  /**
   * Get data with single range (contiguous columns)
   */
  async getAllDataWithSingleRange(sheets, rangeInfo, options = {}) {
    const { limit, offset = 0 } = options;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: rangeInfo.fullRange,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    // Apply pagination at data level
    const paginatedRows = limit ? dataRows.slice(offset, offset + limit) : dataRows.slice(offset);
    
    // Process with column mapping
    return this.processRowsWithColumnMapping(paginatedRows, headers, rangeInfo.columns);
  }

  /**
   * Get data with batchGet (non-contiguous columns) - FIXED WITH majorDimension
   */
  async getAllDataWithBatch(sheets, rangeInfo, options = {}) {
    const { limit, offset = 0 } = options;
    
    console.log(`🔍 [BatchGet] Processing BatchGet request...`);
    console.log(`📊 [BatchGet] Ranges:`, rangeInfo.batchRanges.map(b => `${b.key} -> ${b.range}`));
    
    // Prepare batch request
    const ranges = rangeInfo.batchRanges.map(batch => batch.range);
    
    console.log(`📊 [BatchGet] Calling Google API with ${ranges.length} ranges`);
    
    try {
      const batchRequest = {
        spreadsheetId: SPREADSHEET_ID,
        ranges: ranges,
        valueRenderOption: 'UNFORMATTED_VALUE',
        majorDimension: 'ROWS'  // ✅ FIX: Ensure data is returned as rows, not columns
      };
      
      console.log(`📊 [BatchGet] Making API call...`);
      const apiStartTime = Date.now();
      
      const batchResponse = await sheets.spreadsheets.values.batchGet(batchRequest);
      
      const apiEndTime = Date.now();
      console.log(`✅ [BatchGet] API call completed in ${apiEndTime - apiStartTime}ms`);
      console.log(`✅ [BatchGet] Got ${batchResponse.data.valueRanges?.length || 0} ranges`);

      const valueRanges = batchResponse.data.valueRanges || [];
      
      // Process data
      const processedData = [];
      
      // Find the maximum number of available rows across all ranges
      let maxAvailableRows = 0;
      valueRanges.forEach(valueRange => {
        const rowCount = valueRange?.values?.length || 1;
        maxAvailableRows = Math.max(maxAvailableRows, rowCount);
      });
      
      const maxDataRows = Math.max(0, maxAvailableRows - 1); // Subtract 1 for header
      
      // Calculate how many rows to process (consistent with SingleRange)
      const maxRows = limit ? Math.min(limit, maxDataRows) : maxDataRows;
      
      console.log(`🔄 [BatchGet] Max available rows across ranges: ${maxAvailableRows}, data rows: ${maxDataRows}, processing: ${maxRows}`);
      
      for (let rowIndex = 1; rowIndex <= maxRows; rowIndex++) { // Start from 1 to skip header
        const rowObject = { rowIndex: rowIndex + 1 };
        let hasData = false;
        
        valueRanges.forEach((valueRange, rangeIndex) => {
          const values = valueRange.values || [];
          const batchInfo = rangeInfo.batchRanges[rangeIndex];
          const rawValue = values[rowIndex]?.[0]; // Single column per range
          
          if (rawValue !== undefined) {
            hasData = true;
          }
          
          // Transform value based on type
          rowObject[batchInfo.key] = this.transformValueFast(rawValue, batchInfo.type);
        });
        
        // Only add row if it has data
        if (hasData) {
          processedData.push(rowObject);
        }
        
        // Break if we have enough data (only when limit is specified)
        if (limit && processedData.length >= limit) {
          break;
        }
      }

      console.log(`✅ [BatchGet] Processed ${processedData.length} records`);
      return processedData;
      
    } catch (error) {
      console.error(`❌ [BatchGet] Error:`, error.message);
      console.error(`📋 [BatchGet] Failed ranges:`, ranges);
      throw error;
    }
  }

  /**
   * Fast transform value - SAFE VERSION
   */
  transformValueFast(value, type) {
    // Handle null/undefined values first
    if (value === null || value === undefined || value === '') {
      switch (type) {
        case 'number':
        case 'currency':
          return 0;
        default:
          return '';
      }
    }

    switch (type) {
      case 'number':
      case 'currency':
        return typeof value === 'number' ? value : (parseFloat(value) || 0);
      
      case 'string':
        return String(value);
      
      case 'date':
      case 'datetime':
        // Simplified date handling
        if (typeof value === 'number' && value > 1) {
          return new Date((value - 25569) * 86400 * 1000).toLocaleDateString('vi-VN');
        }
        return String(value);
      
      case 'text':
      default:
        return String(value);
    }
  }

  /**
   * Process rows với column mapping
   */
  processRowsWithColumnMapping(dataRows, headers, columns) {
    const result = [];
    console.log(`🔍 Processing ${dataRows.length} rows with ${columns.length} columns`);
    
    // Process each row
    dataRows.forEach((row, rowIndex) => {
      const rowObject = { rowIndex: rowIndex + 2 }; // +2 because of header and 0-based index
      
      columns.forEach(col => {
        // Use column index to get raw value
        const rawValue = row[col.index];
        const transformedValue = this.transformValueFast(rawValue, col.type);
        rowObject[col.key] = transformedValue;
      });
      
      result.push(rowObject);
    });

    return result;
  }

  /**
   * Convert column index to letter (1=A, 2=B, etc.)
   */
  getColumnLetter(colIndex) {
    let result = '';
    while (colIndex > 0) {
      colIndex--;
      result = String.fromCharCode(65 + (colIndex % 26)) + result;
      colIndex = Math.floor(colIndex / 26);
    }
    return result;
  }

  /**
   * Get row count
   */
  async getRowCount(sheetName) {
    try {
      const sheets = await this.getAuthenticatedClient();
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:A`,
        valueRenderOption: 'UNFORMATTED_VALUE'
      });

      const values = response.data.values || [];
      return Math.max(0, values.length - 1); // Subtract 1 for header
    } catch (error) {
      throw new Error(`Failed to get row count: ${error.message}`);
    }
  }
}

export default GoogleSheetsService;
