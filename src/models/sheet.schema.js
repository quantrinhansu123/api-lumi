// Schema cho các bảng Google Sheets
export const SHEET_SCHEMAS = {
  'F3 test': {
    name: 'F3 test',
    columns: [
      { key: 'Mã đơn hàng', header: 'Mã đơn hàng', type: 'string', required: true },
      { key: 'Mã Tracking', header: 'Mã Tracking', type: 'string' },
      { key: 'Ngày lên đơn', header: 'Ngày lên đơn', type: 'date' },
      { key: 'Name*', header: 'Name*', type: 'string', required: true },
      { key: 'Phone*', header: 'Phone*', type: 'string', required: true },
      { key: 'Add', header: 'Add', type: 'string' },
      { key: 'City', header: 'City', type: 'string' },
      { key: 'State', header: 'State', type: 'string' },
      { key: 'Zipcode', header: 'Zipcode', type: 'string' },
      { key: 'Mặt hàng', header: 'Mặt hàng', type: 'string' },
      { key: 'Tên mặt hàng 1', header: 'Tên mặt hàng 1', type: 'string' },
      { key: 'Số lượng mặt hàng 1', header: 'Số lượng mặt hàng 1', type: 'number' },
      { key: 'Tên mặt hàng 2', header: 'Tên mặt hàng 2', type: 'string' },
      { key: 'Số lượng mặt hàng 2', header: 'Số lượng mặt hàng 2', type: 'number' },
      { key: 'Quà tặng', header: 'Quà tặng', type: 'string' },
      { key: 'Số lượng quà kèm', header: 'Số lượng quà kèm', type: 'number' },
      { key: 'Giá bán', header: 'Giá bán', type: 'number' },
      { key: 'Loại tiền thanh toán', header: 'Loại tiền thanh toán', type: 'string' },
      { key: 'Tổng tiền VNĐ', header: 'Tổng tiền VNĐ', type: 'number' },
      { key: 'Hình thức thanh toán', header: 'Hình thức thanh toán', type: 'string' },
      { key: 'Ghi chú', header: 'Ghi chú', type: 'text' },
      { key: 'Nhân viên Sale', header: 'Nhân viên Sale', type: 'string' },
      { key: 'Nhân viên Marketing', header: 'Nhân viên Marketing', type: 'string' },
      { key: 'NV Vận đơn', header: 'NV Vận đơn', type: 'string' },
      { key: 'Kết quả Check', header: 'Kết quả Check', type: 'string' },
      { key: 'Trạng thái giao hàng NB', header: 'Trạng thái giao hàng NB', type: 'string' },
      { key: 'Lý do', header: 'Lý do', type: 'string' },
      { key: 'Đơn vị vận chuyển', header: 'Đơn vị vận chuyển', type: 'string' },
      { key: 'Trạng thái thu tiền', header: 'Trạng thái thu tiền', type: 'string' },
      { key: 'Ngày hẹn đẩy đơn', header: 'Ngày hẹn đẩy đơn', type: 'date' },
      { key: 'Số tiền thực thu', header: 'Số tiền thực thu', type: 'number' },
      { key: 'Ngày Up bill', header: 'Ngày Up bill', type: 'date' },
      { key: 'Ảnh bill', header: 'Ảnh bill', type: 'string' },
      { key: 'Ngày chuyển khoản', header: 'Ngày chuyển khoản', type: 'date' },
      { key: 'Loại thanh toán', header: 'Loại thanh toán', type: 'string' },
      { key: 'Tên người chuyển khoản', header: 'Tên người chuyển khoản', type: 'string' },
      { key: 'Tài khoản nhận', header: 'Tài khoản nhận', type: 'string' },
      { key: 'Số tiền đã nhận', header: 'Số tiền đã nhận', type: 'number' },
      { key: 'Tỷ giá cước', header: 'Tỷ giá cước', type: 'number' },
      { key: 'Đơn vị tiền đối soát', header: 'Đơn vị tiền đối soát', type: 'string' },
      { key: 'Ngày đối soát cước', header: 'Ngày đối soát cước', type: 'date' },
      { key: 'Tiền ship', header: 'Tiền ship', type: 'number' },
      { key: 'Tỷ giá', header: 'Tỷ giá', type: 'number' },
      { key: 'Đơn vị tiền tệ tính cước', header: 'Đơn vị tiền tệ tính cước', type: 'string' },
      { key: 'Thời gian lên đơn', header: 'Thời gian lên đơn', type: 'datetime' },
      { key: 'Ghi chú của FFM', header: 'Ghi chú của FFM', type: 'text' },
      { key: 'FFM thanh toán', header: 'FFM thanh toán', type: 'string' },
      { key: 'Ngày đối soát bill', header: 'Ngày đối soát bill', type: 'date' },
      { key: 'Ngày Kế toán đối soát với FFM lần 1', header: 'Ngày Kế toán đối soát với FFM lần 1', type: 'date' },
      { key: 'Số tiền về TK Cty từ FFM lần 1', header: 'Số tiền về TK Cty từ FFM lần 1', type: 'number' },
      { key: 'Ngày Kế toán đối soát với FFM lần 2', header: 'Ngày Kế toán đối soát với FFM lần 2', type: 'date' },
      { key: 'Tiền Việt đã đối soát', header: 'Tiền Việt đã đối soát', type: 'number' },
      { key: 'Ngày Kế toán đối soát với FFM lần 3', header: 'Ngày Kế toán đối soát với FFM lần 3', type: 'date' },
      { key: 'Ca', header: 'Ca', type: 'string' },
      { key: 'Tổng số tiền từ FFM', header: 'Tổng số tiền từ FFM', type: 'number' },
      { key: 'Số tiền về TK Cty ngoài FFM', header: 'Số tiền về TK Cty ngoài FFM', type: 'number' },
      { key: 'Số tiền của đơn hàng đã về TK Cty', header: 'Số tiền của đơn hàng đã về TK Cty', type: 'number' },
      { key: 'Kế toán xác nhận thu tiền về', header: 'Kế toán xác nhận thu tiền về', type: 'string' },
      { key: 'Thông tin đơn', header: 'Thông tin đơn', type: 'text' },
      { key: 'Thông tin khách hàng', header: 'Thông tin khách hàng', type: 'text' },
      { key: 'Thông tin nhân sự', header: 'Thông tin nhân sự', type: 'text' },
      { key: 'Phản hồi tích cực', header: 'Phản hồi tích cực', type: 'text' },
      { key: 'Phản hồi tiêu cực', header: 'Phản hồi tiêu cực', type: 'text' },
      { key: 'Count', header: 'Count', type: 'number' },
      { key: 'Phân loại KH', header: 'Phân loại KH', type: 'string' },
      { key: 'Xác nhận đơn', header: 'Xác nhận đơn', type: 'string' },
      { key: 'Diễn giải', header: 'Diễn giải', type: 'text' },
      { key: 'Tên page', header: 'Tên page', type: 'string' },
      { key: 'Giá gốc', header: 'Giá gốc', type: 'number' },
      { key: 'Màu backlist', header: 'Màu backlist', type: 'string' },
      { key: 'Trạng thái đơn', header: 'Trạng thái đơn', type: 'string' },
      { key: 'Tiền chiết khấu', header: 'Tiền chiết khấu', type: 'number' },
      { key: 'Phí ship', header: 'Phí ship', type: 'number' },
      { key: 'Tiền sau ship', header: 'Tiền sau ship', type: 'number' },
      { key: 'Tên lên đơn', header: 'Tên lên đơn', type: 'string' },
      { key: 'Tạo bản in', header: 'Tạo bản in', type: 'string' },
      { key: 'In', header: 'In', type: 'string' },
      { key: 'Cảnh báo Blacklist, Trùng đơn', header: 'Cảnh báo Blacklist, Trùng đơn', type: 'text' },
      { key: 'Khu vực', header: 'Khu vực', type: 'string' },
      { key: 'Phí lưu kho', header: 'Phí lưu kho', type: 'number' },
      { key: 'Team', header: 'Team', type: 'string' },
      { key: 'Mã check', header: 'Mã check', type: 'string' },
      { key: 'Ghi chú của BEE', header: 'Ghi chú của BEE', type: 'text' },
      { key: 'Đánh dấu', header: 'Đánh dấu', type: 'string' },
      { key: 'Ngày đóng hàng', header: 'Ngày đóng hàng', type: 'date' },
      { key: 'Trạng thái giao hàng', header: 'Trạng thái giao hàng', type: 'string' },
      { key: 'Thời gian giao dự kiến', header: 'Thời gian giao dự kiến', type: 'datetime' },
      { key: 'Phí ship nội địa Mỹ (usd)', header: 'Phí ship nội địa Mỹ (usd)', type: 'number' },
      { key: 'Phí xử lý đơn đóng hàng-Lưu kho(usd)', header: 'Phí xử lý đơn đóng hàng-Lưu kho(usd)', type: 'number' },
      { key: 'GHI CHÚ', header: 'GHI CHÚ', type: 'text' },
      { key: 'Ngày đối soát', header: 'Ngày đối soát', type: 'date' },
      { key: 'Time kế toán xác nhận', header: 'Time kế toán xác nhận', type: 'datetime' },
      { key: 'Ghi chú của VĐ', header: 'Ghi chú của VĐ', type: 'text' },
      { key: 'Đơn vị thanh toán', header: 'Đơn vị thanh toán', type: 'string' },
      { key: 'Tài khoản thanh toán', header: 'Tài khoản thanh toán', type: 'string' },
      { key: 'Update', header: 'Update', type: 'string' },
      { key: 'Trạng thái dvvc', header: 'Trạng thái dvvc', type: 'string' },
      { key: 'Nhập kho', header: 'Nhập kho', type: 'string' },
      { key: 'Tổng phí vc', header: 'Tổng phí vc', type: 'number' },
      { key: 'Tiền cước', header: 'Tiền cước', type: 'number' },
      { key: 'Số tiền đối soát', header: 'Số tiền đối soát', type: 'number' },
      { key: 'maDonHang', header: 'maDonHang', type: 'string' },
      { key: 'SST đơn MKT', header: 'SST đơn MKT', type: 'string' },
      { key: 'CSKH', header: 'CSKH', type: 'string' },
      { key: 'Thời gian cutoff', header: 'Thời gian cutoff', type: 'datetime' }
    ]
  },
  'MGT nội bộ test': {
    name: 'MGT nội bộ test',
    columns: [
      { key: 'Mã đơn hàng', header: 'Mã đơn hàng', type: 'string', required: true }
    ]
  }
};

// Utility functions cho data validation và transformation
export const DataValidator = {
  validateRequired(value, column) {
    if (column.required && (!value || value.toString().trim() === '')) {
      throw new Error(`Field ${column.header} is required`);
    }
    return true;
  },

  transformValue(value, type) {
    if (!value || value === '') return '';
    
    switch (type) {
      case 'string':
        return value.toString().trim();
      
      case 'number':
        const num = parseFloat(value.toString().replace(/[,\s]/g, ''));
        return isNaN(num) ? 0 : num;
      
      case 'date':
        // Xử lý ngày tháng
        if (value instanceof Date) return value.toLocaleDateString('vi-VN');
        if (typeof value === 'string' && value.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
          return value;
        }
        return '';
      
      case 'datetime':
        // Xử lý ngày giờ
        if (value instanceof Date) return value.toLocaleString('vi-VN');
        return value.toString();
      
      case 'text':
        return value.toString();
      
      default:
        return value.toString();
    }
  },

  validateRow(rowData, sheetName) {
    const schema = SHEET_SCHEMAS[sheetName];
    if (!schema) {
      throw new Error(`Schema not found for sheet: ${sheetName}`);
    }

    const validatedData = {};
    const errors = [];

    schema.columns.forEach(column => {
      const value = rowData[column.key];
      
      try {
        // Validate required fields
        this.validateRequired(value, column);
        
        // Transform and validate data type
        validatedData[column.key] = this.transformValue(value, column.type);
      } catch (error) {
        errors.push(`${column.header}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }

    return validatedData;
  },

  // Convert validated data to array format for Google Sheets
  dataToArray(rowData, sheetName) {
    const schema = SHEET_SCHEMAS[sheetName];
    if (!schema) {
      throw new Error(`Schema not found for sheet: ${sheetName}`);
    }

    return schema.columns.map(column => rowData[column.key] || '');
  },

  // Convert array from Google Sheets to object
  arrayToData(rowArray, sheetName) {
    const schema = SHEET_SCHEMAS[sheetName];
    if (!schema) {
      throw new Error(`Schema not found for sheet: ${sheetName}`);
    }

    const data = {};
    schema.columns.forEach((column, index) => {
      data[column.key] = rowArray[index] || '';
    });

    return data;
  },

  // Get headers array for a sheet
  getHeaders(sheetName) {
    const schema = SHEET_SCHEMAS[sheetName];
    if (!schema) {
      throw new Error(`Schema not found for sheet: ${sheetName}`);
    }

    return schema.columns.map(column => column.header);
  }
};

export default SHEET_SCHEMAS;
