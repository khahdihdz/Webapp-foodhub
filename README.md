# 📖 HƯỚNG DẪN CÀI ĐẶT WEB APP GIAO ĐỒ ĂN

## 🎯 Tổng Quan

Web app giao đồ ăn với các tính năng:
- ✅ Giao diện đẹp với Bootstrap 5
- ✅ Quản lý menu từ Google Sheets
- ✅ Thông báo đơn hàng qua Telegram
- ✅ Tự động tính khoảng cách và phí ship
- ✅ Nút báo lỗi cho người dùng
- ✅ Bảo mật với Cloudflare
- ✅ Không cần Google Maps API

---

## 📋 BƯỚC 1: TẠO TELEGRAM BOT

### 1.1 Tạo Bot
1. Mở Telegram, tìm kiếm `@BotFather`
2. Gửi lệnh `/newbot`
3. Đặt tên bot (ví dụ: `Giao Đồ Ăn Bot`)
4. Đặt username (ví dụ: `giaodoan_bot`)
5. Lưu lại **Bot Token** (dạng: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 1.2 Lấy Chat ID
1. Tìm kiếm `@userinfobot` trên Telegram
2. Bắt đầu chat với bot này
3. Bot sẽ gửi cho bạn **Chat ID** (dạng: `123456789`)

**Hoặc** sử dụng nhóm:
1. Tạo nhóm mới trên Telegram
2. Thêm bot vào nhóm
3. Gửi tin nhắn trong nhóm
4. Truy cập: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
5. Tìm `"chat":{"id":-123456789}` (Chat ID của nhóm có dấu `-`)

---

## 📊 BƯỚC 2: THIẾT LẬP GOOGLE SHEETS

### 2.1 Tạo Google Sheet Mới
1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo Sheet mới
3. Đặt tên: `Giao Đồ Ăn Database`

### 2.2 Thêm Google Apps Script
1. Trong Google Sheet, chọn **Extensions** → **Apps Script**
2. Xóa code mặc định
3. Copy toàn bộ code từ file **`Code.gs`** (đã cung cấp ở trên)
4. Paste vào Apps Script editor
5. Click **💾 Save** (Ctrl+S)
6. Đặt tên project: `Food Delivery API`

### 2.3 Chạy Hàm Khởi Tạo
1. Chọn function `setupSheets` từ dropdown
2. Click **▶️ Run**
3. Cho phép quyền truy cập khi được hỏi
4. Kiểm tra Google Sheet đã có 2 sheet: `Menu` và `Orders`

### 2.4 Deploy Web App
1. Click **Deploy** → **New deployment**
2. Click ⚙️ → Chọn **Web app**
3. Cấu hình:
   - **Description**: `Food Delivery API v1`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. Copy **Web app URL** (dạng: `https://script.google.com/macros/s/ABC.../exec`)

---

## 🌐 BƯỚC 3: CẤU HÌNH WEB APP

### 3.1 Cập Nhật File `app.js`

Mở file `app.js` và thay đổi các giá trị trong object `CONFIG`:

```javascript
const CONFIG = {
    // Thay bằng Web App URL từ Google Apps Script
    GOOGLE_SHEET_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    
    // Thay bằng Bot Token từ BotFather
    TELEGRAM_BOT_TOKEN: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
    
    // Thay bằng Chat ID của bạn hoặc nhóm
    TELEGRAM_CHAT_ID: '123456789',
    
    // Tọa độ shop của bạn (tìm trên Google Maps)
    SHOP_LAT: 10.762622,  // Vĩ độ
    SHOP_LNG: 106.660172, // Kinh độ
    
    // Địa chỉ shop
    SHOP_ADDRESS: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    
    // Phí ship (có thể giữ nguyên)
    BASE_SHIPPING_FEE: 10000,
    DISTANCE_THRESHOLD: 10,
    EXTRA_FEE_PER_KM: 1000,
};
```

### 3.2 Tìm Tọa Độ Shop
1. Truy cập [Google Maps](https://www.google.com/maps)
2. Tìm địa chỉ shop của bạn
3. Click chuột phải vào vị trí → **Copy coordinates**
4. Sẽ có dạng: `10.762622, 106.660172`
5. Số đầu là **LAT** (vĩ độ), số sau là **LNG** (kinh độ)

---

## ☁️ BƯỚC 4: DEPLOY LÊN CLOUDFLARE PAGES

### 4.1 Chuẩn Bị Files
Tạo cấu trúc thư mục:
```
food-delivery-app/
├── index.html
├── styles.css
├── app.js
└── README.md
```

### 4.2 Deploy với Cloudflare Pages

**Cách 1: Qua GitHub**
1. Tạo repository GitHub mới
2. Upload các file vào repository
3. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com)
4. Chọn **Pages** → **Create a project**
5. Kết nối GitHub repository
6. Click **Begin setup** → **Save and Deploy**

**Cách 2: Upload Trực Tiếp**
1. Truy cập [Cloudflare Pages](https://pages.cloudflare.com)
2. Click **Create a project** → **Direct Upload**
3. Kéo thả thư mục chứa files
4. Click **Deploy site**

### 4.3 Cấu Hình Bảo Mật (Optional)
1. Trong Cloudflare Pages, chọn project của bạn
2. **Settings** → **Functions**
3. Thêm **Environment Variables** (nếu cần)
4. **Security** → Bật **Bot Fight Mode**

---

## 📝 BƯỚC 5: QUẢN LÝ DỮ LIỆU

### 5.1 Thêm/Sửa Menu
1. Mở Google Sheet
2. Vào sheet **Menu**
3. Thêm/sửa món ăn theo cột:
   - **ID**: Số thứ tự (phải unique)
   - **Tên món**: Tên món ăn
   - **Mô tả**: Mô tả ngắn gọn
   - **Giá**: Giá tiền (số, không có ký tự)
   - **Hình ảnh**: URL hình ảnh
4. Save → Web sẽ tự động cập nhật

### 5.2 Xem Đơn Hàng
- Mở Google Sheet → Sheet **Orders**
- Tất cả đơn hàng sẽ được lưu tự động
- Có thể sửa cột **Trạng thái** để quản lý

---

## 🧪 BƯỚC 6: KIỂM TRA

### 6.1 Test Telegram Bot
Gửi tin nhắn test:
```
https://api.telegram.org/bot<BOT_TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=Test
```

### 6.2 Test Google Sheets API
Truy cập:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=getMenu
```
Phải trả về JSON với danh sách món ăn

### 6.3 Test Website
1. Mở website đã deploy
2. Kiểm tra menu hiển thị
3. Thêm món vào giỏ hàng
4. Đặt hàng với địa chỉ test
5. Kiểm tra Telegram và Google Sheet

---

## 🔧 XỬ LÝ LỖI THƯỜNG GẶP

### ❌ Menu không hiển thị
- Kiểm tra `GOOGLE_SHEET_URL` trong `app.js`
- Đảm bảo Apps Script đã deploy với quyền "Anyone"
- Kiểm tra Console (F12) xem có lỗi không

### ❌ Không nhận được thông báo Telegram
- Kiểm tra `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`
- Test API Telegram bằng browser
- Đảm bảo bot đã được thêm vào nhóm (nếu dùng group)

### ❌ Không tính được khoảng cách
- Kiểm tra địa chỉ có đầy đủ không
- Thử thêm tên thành phố vào cuối địa chỉ
- Nominatim API có thể bị limit, chờ 1-2 giây rồi thử lại

### ❌ Lỗi CORS
- Đảm bảo đã deploy lên Cloudflare
- Không chạy trực tiếp file HTML (dùng `file://`)

---

## 🎨 TÙY CHỈNH

### Thay đổi màu sắc
Sửa file `styles.css`:
```css
:root {