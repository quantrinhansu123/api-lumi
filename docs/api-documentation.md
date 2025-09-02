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

### Encoding:
- URL encode các tham số query có ký tự đặc biệt
- Sử dụng UTF-8 encoding cho dữ liệu tiếng Việt
