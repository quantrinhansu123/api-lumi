import GoogleSheetsService from '../services/googleSheets.service.js';

const sheetsService = new GoogleSheetsService();

class SheetsController {
  
  /**
   * Lấy thông tin về spreadsheet và các sheets
   */
  async getSpreadsheetInfo(req, res) {
    try {
      const info = await sheetsService.getSpreadsheetInfo();
      res.json({
        success: true,
        data: info
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Tạo sheet mới
   */
  async createSheet(req, res) {
    try {
      const { sheetName } = req.body;
      
      if (!sheetName) {
        return res.status(400).json({
          success: false,
          message: 'Sheet name is required'
        });
      }

      const result = await sheetsService.createSheet(sheetName);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Xóa sheet
   */
  async deleteSheet(req, res) {
    try {
      const { sheetName } = req.params;
      const result = await sheetsService.deleteSheet(sheetName);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy tất cả dữ liệu từ một sheet
   */
  async getAllData(req, res) {
    try {
      const { sheetName } = req.params;
      const data = await sheetsService.getAllData(sheetName);
      
      res.json({
        success: true,
        data: data,
        count: data.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy dữ liệu theo range
   */
  async getDataByRange(req, res) {
    try {
      const { sheetName } = req.params;
      const { range } = req.query;
      
      if (!range) {
        return res.status(400).json({
          success: false,
          message: 'Range parameter is required'
        });
      }

      const data = await sheetsService.getDataByRange(sheetName, range);
      
      res.json({
        success: true,
        data: data,
        count: data.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Thêm một dòng dữ liệu mới
   */
  async addRow(req, res) {
    try {
      const { sheetName } = req.params;
      const rowData = req.body;
      
      const result = await sheetsService.addRow(sheetName, rowData);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Thêm nhiều dòng dữ liệu
   */
  async addMultipleRows(req, res) {
    try {
      const { sheetName } = req.params;
      const { rows } = req.body;
      
      if (!Array.isArray(rows)) {
        return res.status(400).json({
          success: false,
          message: 'Rows must be an array'
        });
      }

      const result = await sheetsService.addMultipleRows(sheetName, rows);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Cập nhật dòng dữ liệu theo index
   */
  async updateRowByIndex(req, res) {
    try {
      const { sheetName, rowIndex } = req.params;
      const rowData = req.body;
      
      const index = parseInt(rowIndex);
      if (isNaN(index) || index < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid row index'
        });
      }

      const result = await sheetsService.updateRowByIndex(sheetName, index, rowData);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Cập nhật dòng dữ liệu theo điều kiện
   */
  async updateRowByCondition(req, res) {
    try {
      const { sheetName } = req.params;
      const { searchColumn, searchValue, newRowData } = req.body;
      
      if (!searchColumn || !searchValue || !newRowData) {
        return res.status(400).json({
          success: false,
          message: 'searchColumn, searchValue, and newRowData are required'
        });
      }

      const result = await sheetsService.updateRowByCondition(
        sheetName, 
        searchColumn, 
        searchValue, 
        newRowData
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Xóa dòng dữ liệu theo index
   */
  async deleteRowByIndex(req, res) {
    try {
      const { sheetName, rowIndex } = req.params;
      
      const index = parseInt(rowIndex);
      if (isNaN(index) || index < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid row index'
        });
      }

      const result = await sheetsService.deleteRowByIndex(sheetName, index);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Xóa dòng dữ liệu theo điều kiện
   */
  async deleteRowByCondition(req, res) {
    try {
      const { sheetName } = req.params;
      const { searchColumn, searchValue } = req.body;
      
      if (!searchColumn || !searchValue) {
        return res.status(400).json({
          success: false,
          message: 'searchColumn and searchValue are required'
        });
      }

      const result = await sheetsService.deleteRowByCondition(
        sheetName, 
        searchColumn, 
        searchValue
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Tìm kiếm dữ liệu
   */
  async searchRows(req, res) {
    try {
      const { sheetName } = req.params;
      const { searchColumn, searchValue, exactMatch } = req.query;
      
      if (!searchColumn || !searchValue) {
        return res.status(400).json({
          success: false,
          message: 'searchColumn and searchValue are required'
        });
      }

      const isExactMatch = exactMatch === 'true';
      const data = await sheetsService.searchRows(
        sheetName, 
        searchColumn, 
        searchValue, 
        isExactMatch
      );
      
      res.json({
        success: true,
        data: data,
        count: data.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy số lượng dòng có dữ liệu
   */
  async getRowCount(req, res) {
    try {
      const { sheetName } = req.params;
      const count = await sheetsService.getRowCount(sheetName);
      
      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Clear tất cả dữ liệu (giữ lại headers)
   */
  async clearAllData(req, res) {
    try {
      const { sheetName } = req.params;
      const result = await sheetsService.clearAllData(sheetName);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Thiết lập lại headers cho sheet
   */
  async setHeaders(req, res) {
    try {
      const { sheetName } = req.params;
      const result = await sheetsService.setHeaders(sheetName);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy schema của một sheet
   */
  async getSheetSchema(req, res) {
    try {
      const { sheetName } = req.params;
      const schema = sheetsService.getSheetSchema(sheetName);
      
      if (!schema) {
        return res.status(404).json({
          success: false,
          message: `Schema not found for sheet: ${sheetName}`
        });
      }

      res.json({
        success: true,
        data: schema
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Lấy danh sách tất cả schemas có sẵn
   */
  async getAvailableSchemas(req, res) {
    try {
      const schemas = sheetsService.getAvailableSchemas();
      
      res.json({
        success: true,
        data: { schemas }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new SheetsController();
