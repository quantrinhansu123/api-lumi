# 📚 GOOGLE SHEETS API - HƯỚNG DẪN ĐẦY ĐỦ

## 🎯 TỔNG QUAN HỆ THỐNG

Hệ thống API quản lý Google Sheets được thiết kế đặc biệt cho 2 bảng dữ liệu:

### 📊 **Bảng F3 test** (89 cột)
Bảng chính chứa thông tin đơn hàng đầy đủ với các nhóm dữ liệu:

#### **1. Thông tin đơn hàng cơ bản**
- `maDonHang` (*)  - Mã đơn hàng
- `maTracking` - Mã Tracking  
- `ngayLenDon` - Ngày lên đơn

#### **2. Thông tin khách hàng**
- `name` (*) - Tên khách hàng
- `phone` (*) - Số điện thoại
- `address` - Địa chỉ
- `city` - Thành phố
- `state` - Tỉnh/Bang
- `zipcode` - Mã bưu điện

#### **3. Thông tin sản phẩm**
- `matHang` - Mặt hàng
- `tenMatHang1` - Tên mặt hàng 1
- `soLuongMatHang1` - Số lượng mặt hàng 1
- `tenMatHang2` - Tên mặt hàng 2
- `soLuongMatHang2` - Số lượng mặt hàng 2
- `quaTang` - Quà tặng
- `soLuongQuaKem` - Số lượng quà kèm

#### **4. Thông tin thanh toán**
- `giaBan` - Giá bán
- `loaiTienThanhToan` - Loại tiền thanh toán
- `tongTienVND` - Tổng tiền VNĐ
- `hinhThucThanhToan` - Hình thức thanh toán

#### **5. Thông tin nhân sự**
- `nhanVienSale` - Nhân viên Sale
- `nhanVienMarketing` - Nhân viên Marketing  
- `nvVanDon` - NV Vận đơn

#### **6. Thông tin vận chuyển**
- `donViVanChuyen` - Đơn vị vận chuyển
- `trangThaiGiaoHangNB` - Trạng thái giao hàng NB
- `trangThaiGiaoHang` - Trạng thái giao hàng
- `phiShip` - Phí ship
- `tienShip` - Tiền ship

#### **7. Thông tin kế toán & đối soát**
- `trangThaiThuTien` - Trạng thái thu tiền
- `soTienThucThu` - Số tiền thực thu
- `ngayUpBill` - Ngày Up bill
- `ngayChuyenKhoan` - Ngày chuyển khoản
- `soTienDaNhan` - Số tiền đã nhận
- `tyGiaCuoc` - Tỷ giá cước
- `ngayDoiSoatCuoc` - Ngày đối soát cước
- Và 30+ trường khác về FFM, đối soát, kế toán...

### 📋 **Bảng MGT nội bộ test** (1 cột)
- `maDonHang` (*) - Mã đơn hàng

(*) = Trường bắt buộc

---

## 🚀 CÁCH SỬ DỤNG API

### **Base URL:** `http://localhost:8081/sheet`

---

## 📖 1. API QUẢN LÝ SPREADSHEET

### **1.1 Lấy thông tin spreadsheet**
```http
GET /sheet/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Tên Spreadsheet",
    "sheets": [
      {
        "sheetId": 0,
        "title": "F3 test", 
        "gridProperties": {
          "rowCount": 1000,
          "columnCount": 89
        }
      }
    ]
  }
}
```

### **1.2 Lấy danh sách schemas**
```http
GET /sheet/schemas
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schemas": ["F3 test", "MGT nội bộ test"]
  }
}
```

### **1.3 Lấy schema chi tiết**
```http
GET /sheet/{sheetName}/schema
```

**Ví dụ:**
```http
GET /sheet/F3%20test/schema
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "F3 test",
    "columns": [
      {
        "key": "maDonHang",
        "header": "Mã đơn hàng", 
        "type": "string",
        "required": true
      },
      {
        "key": "name",
        "header": "Name*",
        "type": "string", 
        "required": true
      }
      // ... 87 cột khác
    ]
  }
}
```

---

## 🛠️ 2. API QUẢN LÝ SHEET

### **2.1 Tạo sheet mới**
```http
POST /sheet
Content-Type: application/json

{
  "sheetName": "F3 test"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sheetId": 123456789,
    "title": "F3 test",
    "message": "Sheet created successfully with headers"
  }
}
```

### **2.2 Xóa sheet**
```http
DELETE /sheet/{sheetName}
```

### **2.3 Thiết lập lại headers**
```http
PUT /sheet/{sheetName}/headers
```

### **2.4 Xóa toàn bộ dữ liệu (giữ headers)**
```http
DELETE /sheet/{sheetName}/data
```

---

## 📊 3. API LẤY DỮ LIỆU

### **3.1 Lấy tất cả dữ liệu**
```http
GET /sheet/{sheetName}/data
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "maDonHang": "DH001",
      "name": "Nguyễn Văn A",
      "phone": "0123456789",
      "ngayLenDon": "01/09/2025",
      "giaBan": 500000,
      "tongTienVND": 500000
      // ... các trường khác
    }
  ],
  "count": 150
}
```

### **3.2 Lấy dữ liệu theo range**
```http
GET /sheet/{sheetName}/data/range?range=A1:E10
```

### **3.3 Đếm số dòng dữ liệu**
```http
GET /sheet/{sheetName}/count
```

**Response:**
```json
{
  "success": true,
  "data": { "count": 150 }
}
```

### **3.4 Tìm kiếm dữ liệu**
```http
GET /sheet/{sheetName}/search?searchColumn=maDonHang&searchValue=DH001&exactMatch=true
```

**Parameters:**
- `searchColumn` - Tên cột để tìm
- `searchValue` - Giá trị cần tìm  
- `exactMatch` - true (chính xác) / false (chứa từ khóa)

---

## ✏️ 4. API THÊM/SỬA/XÓA DỮ LIỆU

### **4.1 Thêm 1 dòng dữ liệu**
```http
POST /sheet/{sheetName}/rows
Content-Type: application/json

{
  "maDonHang": "DH240902001",
  "name": "Nguyễn Văn A", 
  "phone": "0123456789",
  "address": "123 Đường ABC, Quận 1",
  "city": "Hồ Chí Minh",
  "ngayLenDon": "02/09/2025",
  "giaBan": 750000,
  "tongTienVND": 750000,
  "loaiTienThanhToan": "VND",
  "hinhThucThanhToan": "Chuyển khoản",
  "nhanVienSale": "Sale01",
  "nhanVienMarketing": "MKT01",
  "matHang": "Điện thoại",
  "tenMatHang1": "iPhone 15",
  "soLuongMatHang1": 1,
  "trangThaiDon": "Mới tạo"
}
```

### **4.2 Thêm nhiều dòng**
```http
POST /sheet/{sheetName}/rows/batch
Content-Type: application/json

{
  "rows": [
    {
      "maDonHang": "DH240902002",
      "name": "Trần Thị B",
      "phone": "0987654321"
    },
    {
      "maDonHang": "DH240902003", 
      "name": "Lê Văn C",
      "phone": "0111222333"
    }
  ]
}
```

### **4.3 Sửa dữ liệu theo index**
```http
PUT /sheet/{sheetName}/rows/{rowIndex}
Content-Type: application/json

{
  "trangThaiDon": "Đã xác nhận",
  "ketQuaCheck": "OK",
  "nhanVienSale": "Sale02"
}
```

**Lưu ý:** `rowIndex` bắt đầu từ 0, không tính header

### **4.4 Sửa dữ liệu theo điều kiện**
```http
PUT /sheet/{sheetName}/rows/condition
Content-Type: application/json

{
  "searchColumn": "maDonHang", 
  "searchValue": "DH240902001",
  "newRowData": {
    "trangThaiDon": "Đang giao",
    "donViVanChuyen": "Giao Hàng Nhanh",
    "maTracking": "GHN123456789"
  }
}
```

### **4.5 Xóa dữ liệu theo index**
```http
DELETE /sheet/{sheetName}/rows/{rowIndex}
```

### **4.6 Xóa dữ liệu theo điều kiện**
```http
DELETE /sheet/{sheetName}/rows/condition
Content-Type: application/json

{
  "searchColumn": "maDonHang",
  "searchValue": "DH240902001"
}
```

---

## 🔧 5. API UTILITY NÂNG CAO

### **5.1 Backup dữ liệu**
```http
POST /sheet/{sheetName}/backup
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sheetName": "F3 test",
    "timestamp": "2025-09-02T10:30:00.000Z",
    "data": [...], // Toàn bộ dữ liệu
    "totalRows": 150,
    "message": "Backup completed"
  }
}
```

### **5.2 Restore từ backup**
```http
POST /sheet/{sheetName}/restore
Content-Type: application/json

{
  "backupData": [
    {
      "maDonHang": "DH001",
      "name": "Test"
    }
    // ... dữ liệu backup
  ]
}
```

### **5.3 Copy dữ liệu giữa các sheet**
```http
POST /sheet/copy
Content-Type: application/json

{
  "sourceSheetName": "F3 test",
  "targetSheetName": "F3 backup"
}
```

### **5.4 Validate dữ liệu hàng loạt**
```http
POST /sheet/{sheetName}/validate
Content-Type: application/json

{
  "rows": [
    {
      "maDonHang": "DH001",
      "name": "Test",
      "phone": "123" // Thiếu trường bắt buộc
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validRows": [...],
    "errors": [
      {
        "rowIndex": 0,
        "error": "Phone* is required",
        "data": {...}
      }
    ],
    "validCount": 0,
    "errorCount": 1,
    "totalRows": 1
  }
}
```

### **5.5 Import dữ liệu với validation**
```http
POST /sheet/{sheetName}/import
Content-Type: application/json

{
  "rows": [
    {
      "maDonHang": "DH240902010",
      "name": "Import Test 1",
      "phone": "0123000001"
    },
    {
      "maDonHang": "DH240902011", 
      "name": "Import Test 2",
      "phone": "0123000002"
    }
  ],
  "options": {
    "skipErrors": true,        // Bỏ qua dòng lỗi
    "clearBeforeImport": false // Không xóa dữ liệu cũ
  }
}
```

### **5.6 Thống kê sheet**
```http
GET /sheet/{sheetName}/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRows": 150,
    "emptyRows": 5,
    "columnStats": {
      "maDonHang": {
        "header": "Mã đơn hàng",
        "type": "string", 
        "totalValues": 150,
        "emptyValues": 0,
        "uniqueCount": 150
      },
      "name": {
        "header": "Name*",
        "type": "string",
        "totalValues": 145,
        "emptyValues": 5,
        "uniqueCount": 140
      }
    }
  }
}
```

### **5.7 Tìm và thay thế**
```http
POST /sheet/{sheetName}/find-replace
Content-Type: application/json

{
  "searchValue": "Chưa xác nhận",
  "replaceValue": "Đã xác nhận", 
  "options": {
    "searchColumns": ["trangThaiDon", "ketQuaCheck"], // Null = tìm tất cả cột
    "exactMatch": false,      // false = chứa từ khóa
    "caseSensitive": false    // false = không phân biệt hoa thường
  }
}
```

### **5.8 Export CSV**
```http
GET /sheet/{sheetName}/export/csv
```

Response sẽ là file CSV download trực tiếp.

### **5.9 Duplicate sheet**
```http
POST /sheet/duplicate
Content-Type: application/json

{
  "sourceSheetName": "F3 test",
  "newSheetName": "F3 test - Copy"
}
```

---

## 📝 6. VÍ DỤ THỰC TẾ

### **Kịch bản 1: Thêm đơn hàng mới**
```bash
# 1. Thêm đơn hàng
POST /sheet/F3%20test/rows
{
  "maDonHang": "DH240902100",
  "name": "Nguyễn Thị Mai",
  "phone": "0909123456", 
  "address": "456 Lê Lợi, Quận 3",
  "city": "TP.HCM",
  "state": "Hồ Chí Minh",
  "ngayLenDon": "02/09/2025",
  "matHang": "Laptop",
  "tenMatHang1": "MacBook Air M2",
  "soLuongMatHang1": 1,
  "giaBan": 25000000,
  "tongTienVND": 25000000,
  "loaiTienThanhToan": "VND",
  "hinhThucThanhToan": "Chuyển khoản",
  "nhanVienSale": "Tuấn",
  "nhanVienMarketing": "Linh",
  "trangThaiDon": "Mới tạo"
}
```

### **Kịch bản 2: Cập nhật trạng thái đơn hàng**
```bash
# 1. Tìm đơn hàng
GET /sheet/F3%20test/search?searchColumn=maDonHang&searchValue=DH240902100

# 2. Cập nhật trạng thái
PUT /sheet/F3%20test/rows/condition
{
  "searchColumn": "maDonHang",
  "searchValue": "DH240902100",
  "newRowData": {
    "trangThaiDon": "Đã xác nhận",
    "ketQuaCheck": "Đã check OK",
    "donViVanChuyen": "Viettel Post",
    "maTracking": "VTP987654321"
  }
}
```

### **Kịch bản 3: Import đơn hàng hàng loạt**
```bash
POST /sheet/F3%20test/import
{
  "rows": [
    {
      "maDonHang": "DH240902101",
      "name": "Khách hàng 1", 
      "phone": "0901111111",
      "giaBan": 500000
    },
    {
      "maDonHang": "DH240902102",
      "name": "Khách hàng 2",
      "phone": "0902222222", 
      "giaBan": 750000
    }
  ],
  "options": {
    "skipErrors": true,
    "clearBeforeImport": false
  }
}
```

---

## ⚠️ 7. LƯU Ý QUAN TRỌNG

### **7.1 Validation Rules**
- **Trường bắt buộc F3 test:** maDonHang, name, phone
- **Trường bắt buộc MGT nội bộ:** maDonHang
- **Kiểu dữ liệu:** Tự động convert số, tiền tệ, ngày tháng
- **Ngày tháng:** Định dạng dd/mm/yyyy

### **7.2 Error Responses**
```json
// Validation Error
{
  "success": false,
  "message": "Validation errors: Name* is required, Phone* is required"
}

// Not Found Error  
{
  "success": false,
  "message": "Row with maDonHang = \"DH999\" not found"
}

// Server Error
{
  "success": false, 
  "message": "Failed to update row: Invalid range"
}
```

### **7.3 Performance**
- **Không cache:** Dữ liệu luôn real-time từ Google Sheets
- **Batch operations:** Khuyến khích dùng cho > 10 rows
- **Rate limiting:** Google Sheets API có giới hạn 100 requests/100 seconds

### **7.4 Security**
- File `sheetCredentials.json` phải được bảo mật
- Không expose credentials trong code
- Sử dụng service account với quyền hạn tối thiểu

---

## 🎯 8. TESTING

### **8.1 Test cơ bản**
```bash
# Kiểm tra server
GET /sheet/info

# Kiểm tra schemas
GET /sheet/schemas

# Test thêm dữ liệu
POST /sheet/F3%20test/rows
{
  "maDonHang": "TEST001",
  "name": "Test User", 
  "phone": "0123456789"
}
```

### **8.2 Test nâng cao**
```bash
# Test validation
POST /sheet/F3%20test/validate
{
  "rows": [
    {"maDonHang": "TEST002"} // Thiếu name và phone
  ]
}

# Test search
GET /sheet/F3%20test/search?searchColumn=maDonHang&searchValue=TEST001

# Test statistics
GET /sheet/F3%20test/statistics
```

---

## 🔗 9. POSTMAN COLLECTION

Để dễ dàng test, tạo Postman Collection với:

**Base URL:** `http://localhost:8081`

**Environment Variables:**
- `baseUrl`: `http://localhost:8081`
- `sheetName`: `F3 test`
- `testOrderId`: `DH240902999`

**Sample Requests:**
1. GET Info - `/sheet/info`
2. GET Schemas - `/sheet/schemas` 
3. POST Create Order - `/sheet/{{sheetName}}/rows`
4. GET Search - `/sheet/{{sheetName}}/search`
5. PUT Update - `/sheet/{{sheetName}}/rows/condition`
6. DELETE Remove - `/sheet/{{sheetName}}/rows/condition`

---

## 📞 10. HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra server đang chạy: `npm start`
2. Kiểm tra file credentials tồn tại
3. Verify spreadsheet ID đúng
4. Check schema mapping với headers trong Google Sheets
5. Validate request body format

---

**🎉 Hệ thống sẵn sàng sử dụng! Chúc bạn làm việc hiệu quả!**
