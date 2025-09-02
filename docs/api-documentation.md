# API Documentation - Google Sheets Service

Tài liệu này cung cấp các ví dụ curl cho các API lấy dữ liệu và cập nhật dữ liệu trong Google Sheets.

## Base URL
```
http://localhost:8081/sheet
```

---

## 📊 CÁC API LẤY DỮ LIỆU

### 1. Lấy tất cả dữ liệu từ sheet

**Endpoint:** `GET /sheet/:sheetName/data`

**Mô tả:** Lấy tất cả dữ liệu từ một sheet với tùy chọn phân trang và lọc fields.

**Query Parameters:**
- `limit` (number): Giới hạn số dòng trả về
- `offset` (number): Bỏ qua số dòng đầu (mặc định: 0)
- `fields` (string): Danh sách các cột cần lấy, phân cách bằng dấu phẩy
- `compress` (boolean): ⚠️ **Chưa implement đầy đủ** - Chỉ set header, chưa nén thực sự

**Ví dụ cURL:**

```bash
# Lấy tất cả dữ liệu
curl -X GET "http://localhost:8081/sheet/Orders/data"

# Lấy dữ liệu với phân trang
curl -X GET "http://localhost:8081/sheet/Orders/data?limit=10&offset=0"

# Lấy chỉ một số fields cụ thể
curl -X GET "http://localhost:8081/sheet/Orders/data?fields=Name,Phone,Email"

# URL encode cho sheet name có ký tự đặc biệt
curl -X GET "http://localhost:8081/sheet/F3%20test/data"

# Kết hợp tất cả tham số
curl -X GET "http://localhost:8081/sheet/Orders/data?limit=20&offset=10&fields=Name,Phone"
```

**Response mẫu:**
```json
{
  "success": true,
  "data": [
    {
      "Name": "Nguyễn Văn A",
      "Phone": "0123456789",
      "Email": "a@gmail.com"
    }
  ],
  "meta": {
    "total": 1,
    "returned": 1,
    "queryTime": "45ms",
    "offset": 0,
    "optimization": "smart_range",
    "requestedFields": ["Name", "Phone", "Email"]
  }
}
```

---

### 2. Stream dữ liệu lớn

**Endpoint:** `GET /sheet/:sheetName/stream`

**Mô tả:** Streaming data cho datasets lớn, trả về dữ liệu theo từng batch.

**Query Parameters:**
- `batchSize` (number): Kích thước mỗi batch (mặc định: 100)

**Ví dụ cURL:**

```bash
# Stream dữ liệu với batch size mặc định
curl -X GET "http://localhost:8081/sheet/Orders/stream"

# Stream với batch size tùy chỉnh
curl -X GET "http://localhost:8081/sheet/Orders/stream?batchSize=50"
```

---

### 3. Lấy dữ liệu theo range cụ thể

**Endpoint:** `GET /sheet/:sheetName/data/range`

**Mô tả:** Lấy dữ liệu theo range cụ thể (ví dụ: A1:D10).

**Query Parameters:**
- `range` (string): Range cần lấy (bắt buộc)

**Ví dụ cURL:**

```bash
# Lấy dữ liệu từ A1 đến D10
curl -X GET "http://localhost:8081/sheet/Orders/data/range?range=A1:D10"

# Lấy dữ liệu từ cột A đến C, dòng 1 đến 20
curl -X GET "http://localhost:8081/sheet/Orders/data/range?range=A1:C20"
```

**Response mẫu:**
```json
{
  "success": true,
  "data": [
    ["Header1", "Header2", "Header3"],
    ["Value1", "Value2", "Value3"]
  ],
  "count": 2
}
```

---

### 4. Lấy số lượng dòng có dữ liệu

**Endpoint:** `GET /sheet/:sheetName/count`

**Mô tả:** Lấy tổng số dòng có dữ liệu trong sheet.

**Ví dụ cURL:**

```bash
curl -X GET "http://localhost:8081/sheet/Orders/count"
```

**Response mẫu:**
```json
{
  "success": true,
  "data": {
    "count": 150
  }
}
```

---

### 5. Tìm kiếm dữ liệu theo điều kiện

**Endpoint:** `GET /sheet/:sheetName/search`

**Mô tả:** Tìm kiếm dữ liệu theo điều kiện cụ thể.

**Query Parameters:**
- `searchColumn` (string): Tên cột để tìm kiếm (bắt buộc)
- `searchValue` (string): Giá trị cần tìm (bắt buộc)
- `exactMatch` (boolean): Tìm kiếm chính xác hay không (mặc định: false)

**Ví dụ cURL:**

```bash
# Tìm kiếm không chính xác (chứa từ khóa)
curl -X GET "http://localhost:8081/sheet/Orders/search?searchColumn=Name&searchValue=Nguyễn"

# Tìm kiếm chính xác
curl -X GET "http://localhost:8081/sheet/Orders/search?searchColumn=Phone&searchValue=0123456789&exactMatch=true"

# Tìm kiếm theo email
curl -X GET "http://localhost:8081/sheet/Orders/search?searchColumn=Email&searchValue=gmail.com"
```

**Response mẫu:**
```json
{
  "success": true,
  "data": [
    {
      "Name": "Nguyễn Văn A",
      "Phone": "0123456789",
      "Email": "a@gmail.com"
    }
  ],
  "count": 1
}
```

---

## 🔄 CÁC API CẬP NHẬT DỮ LIỆU

### 1. Cập nhật dòng dữ liệu theo index

**Endpoint:** `PUT /sheet/:sheetName/rows/:rowIndex`

**Mô tả:** Cập nhật một dòng dữ liệu theo index (0-based, không tính header).

**Body:** Object chứa dữ liệu mới để cập nhật

**Ví dụ cURL:**

```bash
# Cập nhật dòng thứ 0 (dòng đầu tiên sau header)
curl -X PUT "http://localhost:8081/sheet/Orders/rows/0" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Nguyễn Văn B",
    "Phone": "0987654321",
    "Email": "b@gmail.com"
  }'

# Cập nhật chỉ một số fields
curl -X PUT "http://localhost:8081/sheet/Orders/rows/1" \
  -H "Content-Type: application/json" \
  -d '{
    "Phone": "0999888777"
  }'
```

**Response mẫu:**
```json
{
  "success": true,
  "data": {
    "updatedRow": 1,
    "message": "Row updated successfully"
  }
}
```

---

### 2. Cập nhật dòng dữ liệu theo điều kiện

**Endpoint:** `PUT /sheet/:sheetName/rows/condition`

**Mô tả:** Cập nhật dòng dữ liệu dựa trên điều kiện tìm kiếm.

**Body:**
- `searchColumn` (string): Cột để tìm kiếm
- `searchValue` (any): Giá trị cần tìm
- `newRowData` (object): Dữ liệu mới để cập nhật

**Ví dụ cURL:**

```bash
# Cập nhật theo số điện thoại
curl -X PUT "http://localhost:8081/sheet/Orders/rows/condition" \
  -H "Content-Type: application/json" \
  -d '{
    "searchColumn": "Phone",
    "searchValue": "0123456789",
    "newRowData": {
      "Name": "Nguyễn Văn C Updated",
      "Email": "c_updated@gmail.com"
    }
  }'

# Cập nhật theo email
curl -X PUT "http://localhost:8081/sheet/Orders/rows/condition" \
  -H "Content-Type: application/json" \
  -d '{
    "searchColumn": "Email",
    "searchValue": "old@gmail.com",
    "newRowData": {
      "Email": "new@gmail.com",
      "Status": "Updated"
    }
  }'
```

**Response mẫu:**
```json
{
  "success": true,
  "data": {
    "updatedRows": 1,
    "message": "Row updated successfully"
  }
}
```

---

### 3. Cập nhật hàng loạt theo Primary Key

**Endpoint:** `PATCH /sheet/:sheetName/update`

**Mô tả:** Cập nhật nhiều dòng dữ liệu theo primary key (cột đầu tiên). Chỉ cập nhật những fields được cung cấp, giữ nguyên các fields khác.

**Query Parameters:**
- `verbose` (boolean): Trả về thông tin chi tiết (mặc định: false)

**Body:** Array các object cập nhật

**Ví dụ cURL:**

```bash
# Cập nhật hàng loạt
curl -X PATCH "http://localhost:8081/sheet/Orders/update" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "Mã đơn hàng": "ABC123",
      "Name*": "Nguyễn Văn A Updated",
      "Phone": "0111222333"
    },
    {
      "Mã đơn hàng": "DEF456",
      "Status": "Completed",
      "Phone": "0444555666"
    }
  ]'

# Cập nhật với thông tin chi tiết
curl -X PATCH "http://localhost:8081/sheet/Orders/update?verbose=true" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "Mã đơn hàng": "ABC123",
      "Name*": "New Name"
    }
  ]'
```

**Response mẫu:**
```json
{
  "success": true,
  "summary": {
    "total": 2,
    "updated": 2,
    "notFound": 0,
    "errors": 0
  },
  "details": [
    {
      "primaryKey": "ABC123",
      "status": "updated",
      "rowIndex": 1
    },
    {
      "primaryKey": "DEF456",
      "status": "updated",
      "rowIndex": 2
    }
  ]
}
```

---

### 4. Cập nhật một record theo Primary Key

**Endpoint:** `PATCH /sheet/:sheetName/update-single`

**Mô tả:** Cập nhật một dòng dữ liệu theo primary key (tối ưu hơn so với version array). Chỉ cập nhật những fields được cung cấp.

**Query Parameters:**
- `verbose` (boolean): Trả về thông tin chi tiết

**Body:** Object chứa dữ liệu cập nhật (không phải array)

**Ví dụ cURL:**

```bash
# Cập nhật một record
curl -X PATCH "http://localhost:8081/sheet/Orders/update-single" \
  -H "Content-Type: application/json" \
  -d '{
    "Mã đơn hàng": "ABC123",
    "Phone": "0999888777"
  }'

# Cập nhật với verbose
curl -X PATCH "http://localhost:8081/sheet/Orders/update-single?verbose=true" \
  -H "Content-Type: application/json" \
  -d '{
    "Mã đơn hàng": "ABC123",
    "Status": "Processing"
  }'
```

**Response mẫu:**
```json
{
  "success": true,
  "data": {
    "primaryKey": "ABC123",
    "status": "updated",
    "rowIndex": 1,
    "updatedFields": ["Status"]
  }
}
```

---

## 📝 LƯU Ý QUAN TRỌNG

### Headers yêu cầu:
```bash
Content-Type: application/json
```

### Xử lý lỗi:
Tất cả API đều trả về format lỗi chuẩn:
```json
{
  "success": false,
  "message": "Error description"
}
```

### Mã lỗi HTTP phổ biến:
- `400`: Bad Request - Thiếu tham số hoặc dữ liệu không hợp lệ
- `404`: Not Found - Sheet không tồn tại
- `500`: Internal Server Error - Lỗi server

### Performance Tips:
1. Sử dụng `fields` parameter để chỉ lấy những cột cần thiết
2. ⚠️ `compress=true` chưa hoạt động đầy đủ (chỉ set header)
3. Sử dụng `/stream` endpoint cho dữ liệu rất lớn
4. Sử dụng `update-single` thay vì `update` cho việc cập nhật một record
5. Sử dụng `limit` và `offset` cho phân trang

---

## ➕ CÁC API THÊM DỮ LIỆU

### 1. Thêm một dòng dữ liệu

**Endpoint:** `POST /sheet/:sheetName/rows`

**Mô tả:** Thêm một dòng dữ liệu mới vào cuối sheet.

**Body:** Object chứa dữ liệu cho dòng mới

**Ví dụ cURL:**

```bash
# Thêm một dòng mới
curl -X POST "http://localhost:8081/sheet/Orders/rows" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Nguyễn Văn A",
    "Phone": "0123456789",
    "Email": "a@gmail.com",
    "Address": "Hà Nội"
  }'

# Thêm dòng vào sheet có tên đặc biệt
curl -X POST "http://localhost:8081/sheet/F3%20test/rows" \
  -H "Content-Type: application/json" \
  -d '{
    "Mã đơn hàng": "ABC123",
    "Name*": "Trần Thị B", 
    "Phone*": "0987654321"
  }'
```

**Response mẫu:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "addedRange": "Orders!A5:D5",
    "addedRow": {
      "Name": "Nguyễn Văn A",
      "Phone": "0123456789",
      "Email": "a@gmail.com"
    }
  }
}
```

---

### 2. Thêm nhiều dòng dữ liệu (Batch) với kiểm tra trùng lặp

**Endpoint:** `POST /sheet/:sheetName/rows/batch`

**Mô tả:** Thêm nhiều dòng dữ liệu cùng lúc với kiểm tra trùng lặp theo primary key (cột đầu tiên). Tối ưu hơn 10-15 lần so với thêm từng dòng.

**Tính năng:**
- ✅ **Kiểm tra trùng lặp** theo primary key (cột đầu tiên)
- ✅ **Chỉ thêm dữ liệu mới**, bỏ qua dữ liệu trùng
- ✅ **Báo cáo chi tiết** về các key bị trùng
- ✅ **Batch processing** cho hiệu suất cao

**Body:**
- `rows` (array): Mảng các object dữ liệu cần thêm

**Giới hạn:** Tối đa 1000 dòng mỗi lần gọi

**Ví dụ cURL:**

```bash
# Thêm nhiều dòng với kiểm tra trùng lặp
curl -X POST "http://localhost:8081/sheet/Orders/rows/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [
      {
        "Mã đơn hàng": "ORD001",
        "Name": "Khách hàng 1",
        "Phone": "0111111111",
        "Email": "kh1@gmail.com"
      },
      {
        "Mã đơn hàng": "ORD002", 
        "Name": "Khách hàng 2",
        "Phone": "0222222222",
        "Email": "kh2@gmail.com"
      },
      {
        "Mã đơn hàng": "ORD001",
        "Name": "Khách hàng 1 Duplicate",
        "Phone": "0333333333"
      }
    ]
  }'

# Batch từ file JSON lớn
curl -X POST "http://localhost:8081/sheet/Orders/rows/batch" \
  -H "Content-Type: application/json" \
  -d @batch_data.json
```

**Response mẫu - Có dữ liệu mới và trùng lặp:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "summary": {
      "totalRequested": 3,
      "added": 2,
      "duplicates": 1,
      "skipped": 1
    },
    "details": {
      "addedRows": 2,
      "addedRange": "Orders!A5:D6",
      "updatedCells": 8,
      "duplicateKeys": ["ORD001"],
      "skippedRows": [
        {
          "index": 2,
          "reason": "Mã khóa chính đã tồn tại",
          "primaryKey": "ORD001",
          "data": {
            "Mã đơn hàng": "ORD001",
            "Name": "Khách hàng 1 Duplicate"
          }
        }
      ]
    },
    "processingTime": "1250ms",
    "rowsPerSecond": 2
  },
  "message": "Đã thêm 2 dòng mới. Bỏ qua 1 mã trùng lặp: ORD001"
}
```

**Response mẫu - Tất cả đều trùng lặp:**
```json
{
  "success": false,
  "data": {
    "success": true,
    "summary": {
      "totalRequested": 2,
      "added": 0,
      "duplicates": 2,
      "skipped": 2
    },
    "details": {
      "addedRows": 0,
      "addedRange": null,
      "updatedCells": 0,
      "duplicateKeys": ["ORD001", "ORD002"]
    },
    "processingTime": "800ms",
    "rowsPerSecond": 2
  },
  "message": "Không thêm được dòng nào. Tất cả 2 mã đã tồn tại: ORD001, ORD002"
}
```

**Response mẫu - Tất cả đều mới:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "summary": {
      "totalRequested": 3,
      "added": 3,
      "duplicates": 0,
      "skipped": 0
    },
    "details": {
      "addedRows": 3,
      "addedRange": "Orders!A5:D7",
      "updatedCells": 12,
      "duplicateKeys": []
    },
    "processingTime": "1250ms",
    "rowsPerSecond": 2
  },
  "message": "Đã thêm thành công tất cả 3 dòng vào sheet Orders"
}
```

---

## 📝 LƯU Ý QUAN TRỌNG

### Headers yêu cầu:
```bash
Content-Type: application/json
```

### Xử lý lỗi:
Tất cả API đều trả về format lỗi chuẩn:
```json
{
  "success": false,
  "message": "Error description"
}
```

### Mã lỗi HTTP phổ biến:
- `400`: Bad Request - Thiếu tham số hoặc dữ liệu không hợp lệ
- `404`: Not Found - Sheet không tồn tại
- `500`: Internal Server Error - Lỗi server

### Performance Tips:
1. Sử dụng `fields` parameter để chỉ lấy những cột cần thiết
2. ⚠️ `compress=true` chưa hoạt động đầy đủ (chỉ set header)
3. Sử dụng `/stream` endpoint cho dữ liệu rất lớn
4. Sử dụng `update-single` thay vì `update` cho việc cập nhật một record
5. Sử dụng `limit` và `offset` cho phân trang
6. **Sử dụng `/rows/batch` thay vì `/rows` cho việc thêm nhiều dòng** (nhanh hơn 10-15 lần)

### Encoding:
- URL encode các tham số query có ký tự đặc biệt
- Sử dụng UTF-8 encoding cho dữ liệu tiếng Việt

### Lưu ý về thêm dữ liệu:
- **Tên cột phải khớp chính xác** với headers trong sheet
- Dữ liệu sẽ được thêm vào **cuối sheet**
- Các cột không có dữ liệu sẽ để trống
- Batch API có giới hạn **1000 dòng** mỗi lần gọi

### Kiểm tra trùng lặp (Batch API):
- **Primary Key:** Cột đầu tiên được dùng làm khóa chính
- **Kiểm tra tự động:** API sẽ kiểm tra trùng lặp trước khi thêm
- **Chỉ thêm mới:** Chỉ thêm những dòng có primary key chưa tồn tại
- **Báo cáo chi tiết:** Response sẽ liệt kê các key bị trùng
- **HTTP Status:** 
  - `200` nếu có ít nhất 1 dòng được thêm thành công
  - `400` nếu không có dòng nào được thêm (tất cả trùng lặp)

### Ví dụ xử lý trùng lặp:
```bash
# Request với dữ liệu trùng lặp
curl -X POST "http://localhost:8081/sheet/Orders/rows/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [
      {"Mã đơn hàng": "ORD001", "Name": "Mới"},     # Sẽ thêm
      {"Mã đơn hàng": "ORD002", "Name": "Trùng"},   # Bỏ qua (đã tồn tại)
      {"Mã đơn hàng": "ORD003", "Name": "Mới"}      # Sẽ thêm
    ]
  }'

# Kết quả: Thêm 2 dòng, bỏ qua 1 dòng trùng
```
