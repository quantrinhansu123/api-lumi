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
   * Lấy tất cả dữ liệu từ một sheet với Smart Range optimizations
   */
  async getAllData(req, res) {
    try {
      const { sheetName } = req.params;
      const { 
        limit, 
        offset = 0, 
        fields,
        compress = false 
      } = req.query;

      // Optimization 1: Streaming response cho data lớn
      if (compress === 'true') {
        res.set({
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip'
        });
      }

      const startTime = Date.now();
      
      // Smart Range with field selection options - với URL decoding
      const options = {
        limit: limit ? parseInt(limit) : undefined,
        offset: parseInt(offset),
        fields: fields ? decodeURIComponent(fields).split(',').map(f => f.trim()) : undefined
      };

      console.log(`📊 Smart Range Request: ${sheetName}`, options);
      
      const result = await sheetsService.getAllData(sheetName, options);
      const queryTime = Date.now() - startTime;

      // Service returns { data: [...], meta: {...} }
      // Don't double-wrap it
      const response = {
        success: true,
        data: result.data,  // Extract data array
        meta: {
          total: result.data.length,
          returned: result.data.length,
          queryTime: `${queryTime}ms`,
          offset: parseInt(offset) || 0,
          optimization: result.meta.optimization,
          requestedFields: options.fields
        }
      };

      if (limit) {
        response.meta.limit = parseInt(limit);
        response.meta.hasMore = false; // Smart range handles pagination internally
      }

      res.json(response);
    } catch (error) {
      console.error('Error in smart getAllData:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Streaming data cho datasets lớn
   */
  async streamData(req, res) {
    try {
      const { sheetName } = req.params;
      const { batchSize = 100 } = req.query;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      // Start JSON response
      res.write('{"success":true,"data":[');

      const data = await sheetsService.getAllData(sheetName);
      const batch = parseInt(batchSize);
      
      for (let i = 0; i < data.length; i += batch) {
        const chunk = data.slice(i, i + batch);
        
        for (let j = 0; j < chunk.length; j++) {
          if (i > 0 || j > 0) res.write(',');
          res.write(JSON.stringify(chunk[j]));
        }
        
        // Flush buffer every batch
        if (i + batch < data.length) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      res.write(`],"meta":{"total":${data.length},"streamed":true}}`);
      res.end();
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
   * Database-like batch update by primary key (first column)
   * Updates only provided fields, keeps others unchanged
   * Body: [{ primaryKey: value, field1: newValue1, field2: newValue2 }, ...]
   */
  async updateByPrimaryKey(req, res) {
    try {
      const { sheetName } = req.params;
      const updates = req.body;
      const { verbose } = req.query; // ?verbose=true
      
      // Validate input
      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          message: 'Request body must be an array of update objects'
        });
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No updates provided'
        });
      }

      const options = {
        verbose: verbose === 'true'
      };

      const result = await sheetsService.updateByPrimaryKey(sheetName, updates, options);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UPDATE SINGLE RECORD - Optimized for single object payload
   * Faster than array version for single record updates
   */
  async updateSingleByPrimaryKey(req, res) {
    try {
      const { sheetName } = req.params;
      const updateData = req.body;
      const { verbose } = req.query;
      
      // Validation: Must be object, not array
      if (Array.isArray(updateData) || typeof updateData !== 'object' || updateData === null) {
        return res.status(400).json({
          success: false,
          error: 'Request body must be a single object (not array)'
        });
      }

      const options = {
        verbose: verbose === 'true'
      };

      const result = await sheetsService.updateSingleByPrimaryKey(sheetName, updateData, options);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
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
