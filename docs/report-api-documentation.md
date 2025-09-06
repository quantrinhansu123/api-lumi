# Report API Documentation

## Base URL
```
http://localhost:8081/report
```

---

## 📊 REPORT GENERATION APIs

### 1. Lấy danh sách các loại báo cáo có sẵn

**Endpoint:** `GET /report/available`

**Mô tả:** Lấy danh sách tất cả các loại báo cáo có thể tạo.

**Ví dụ cURL:**
```bash
curl -X GET "http://localhost:8081/report/available"
```

**Response mẫu:**
```json
{
  "success": true,
  "data": [
    {
      "sheetName": "Báo cáo MKT",
      "description": "Báo cáo tổng hợp Marketing - kết hợp dữ liệu từ Báo cáo MKT, F3 và Nhân sự",
      "dataSources": [
        {
          "spreadsheetId": "1ylYT0UAcahij5UtDikKyJFWT3gIyRZsuFsYQ5aUTi2Y",
          "sheet": "Báo cáo MKT"
        },
        {
          "spreadsheetId": "1rI9cHBNlI2Dc-d6VF6zdKiUagBh-VPFrWdddPysuSmo",
          "sheet": "F3"
        },
        {
          "spreadsheetId": "1ylYT0UAcahij5UtDikKyJFWT3gIyRZsuFsYQ5aUTi2Y",
          "sheet": "Nhân sự"
        }
      ]
    }
  ],
  "meta": {
    "totalAvailable": 1
  }
}
```

---

### 2. Tạo báo cáo theo sheetName

**Endpoint:** `POST /report/generate`

**Mô tả:** Tạo báo cáo tổng hợp dựa trên sheetName được cung cấp.

**Request Body:**
```json
{
  "sheetName": "Báo cáo MKT"
}
```

**Ví dụ cURL:**
```bash
curl -X POST "http://localhost:8081/report/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "sheetName": "Báo cáo MKT"
  }'
```

**Response mẫu:**
```json
{
  "success": true,
  "message": "Report generated successfully for Báo cáo MKT",
  "data": [
    {
      "id": "jsdsj13",
      "Tên": "Đoàn Ngọc Huân",
      "Email": "doanhuan1609@gmail.com",
      "Chức vụ": "NV",
      "Ngày": "2025-08-01T00:00:00.000Z",
      "ca": "Hết Ca",
      "Sản_phẩm": "Bakuchiol Retinol",
      "Thị_trường": "Canada",
      "page": "",
      "TKQC": "51",
      "CPQC": 323689,
      "Via_log": "Huân",
      "Số_Mess_Cmt": 2,
      "Số đơn": "",
      "Doanh số": "",
      "Team": "MKT - Cường",
      "id_NS": "fgfdgd24",
      "Doanh số đi": "",
      "Số đơn hoàn hủy": "",
      "DS chốt": "",
      "DS sau hoàn hủy": "",
      "Doanh số sau ship": "",
      "Doanh số TC": "",
      "KPIs": "",
      "CPQC theo TKQC": "",
      "Báo cáo theo Page": "",
      "Trạng thái": "",
      "Cảnh báo": "",
      "Số đơn thực tế": 3,
      "Doanh thu chốt thực tế": 1500000,
      "Doanh số đi thực tế": 0,
      "Doanh số hoàn hủy thực tế": 0,
      "Số đơn hoàn hủy thực tế": 0,
      "Doanh số sau hoàn hủy thực tế": 0
    }
  ],
  "meta": {
    "totalRecords": 150,
    "baoCaoMKTRecords": 120,
    "f3Records": 300,
    "nhanSuRecords": 50,
    "processedAt": "2025-09-06T10:30:00.000Z",
    "processingTime": "2500ms",
    "requestedSheet": "Báo cáo MKT"
  }
}
```

---

## 🔄 Logic xử lý báo cáo

### Báo cáo MKT
1. **Lấy dữ liệu từ 3 sheets song song:**
   - Báo cáo MKT (1ylYT0UAcahij5UtDikKyJFWT3gIyRZsuFsYQ5aUTi2Y)
   - F3 (1rI9cHBNlI2Dc-d6VF6zdKiUagBh-VPFrWdddPysuSmo) 
   - Nhân sự (1ylYT0UAcahij5UtDikKyJFWT3gIyRZsuFsYQ5aUTi2Y)

2. **Khởi tạo báo cáo từ dữ liệu Báo cáo MKT**
   - Tạo structure object với tất cả fields cần thiết
   - Tra cứu chức vụ từ dữ liệu Nhân sự

3. **Xử lý dữ liệu F3:**
   - Matching theo: Ngày lên đơn = Ngày, Nhân viên Marketing = Tên, Mặt hàng = Sản_phẩm, Khu vực = Thị_trường
   - Nếu match: cập nhật "Số đơn thực tế" += 1
   - Nếu không match: tạo record mới với "Số đơn thực tế" = 1

4. **Kết quả:** Báo cáo tổng hợp với số liệu thực tế từ F3

---

## ⚠️ Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "sheetName is required"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to process marketing report: [error details]",
  "error": "[stack trace in development mode]"
}
```
