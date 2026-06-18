# Coffee Store - SQL Server Version

Chào mừng bạn đến với dự án **Coffee Store**, một ứng dụng web thương mại điện tử chuyên về cà phê và trà, được xây dựng bằng **Node.js (Express)** và **SQL Server** thông qua **Prisma ORM**.

Dự án này đã được chuyển đổi từ MongoDB sang mô hình cơ sở dữ liệu quan hệ (Relational Database) để tối ưu hóa tính toàn vẹn dữ liệu và hiệu năng.

---

## 🛠 Công nghệ sử dụng
- **Backend:** Node.js, Express.js
- **Database:** Microsoft SQL Server
- **ORM:** Prisma
- **Template Engine:** EJS
- **Xác thực:** JWT (JSON Web Token), Cookies
- **Thanh toán:** VNPay & Tiền mặt (COD)

---

## Yêu cầu hệ thống
Trước khi cài đặt, hãy đảm bảo máy bạn đã có:
1. **Node.js** (Phiên bản 16 trở lên)
2. **Microsoft SQL Server** (Local hoặc Azure)
3. **npm** (Đi kèm với Node.js)

---

## Hướng dẫn cài đặt và Chạy dự án

### 1. Tải dự án và Cài đặt thư viện
Mở terminal tại thư mục dự án và chạy:
```bash
npm install
```

### 2. Cấu hình Biến môi trường
Tạo hoặc chỉnh sửa file `.env` tại thư mục gốc với nội dung sau:
```env
# Chuỗi kết nối SQL Server
DATABASE_URL="sqlserver://<HOST>:<PORT>;database=<DB_NAME>;user=<USER>;password=<PASSWORD>;encrypt=false;trustServerCertificate=true"

# Cấu hình JWT
JWT_SECRET="your_very_secret_key"

# Cổng chạy ứng dụng
PORT=3030
```
*Lưu ý: Thay thế `<HOST>`, `<USER>`,... bằng thông tin thực tế của SQL Server trên máy bạn.*

### 3. Đồng bộ Database Schema (Migration)
Chạy lệnh sau để Prisma tự động tạo các bảng (User, Product, Cart,...) trong SQL Server của bạn:
```bash
npx prisma migrate dev --name init_sql_server
```

### 4. Nạp dữ liệu mẫu (Seeding)
Để có sẵn 50 sản phẩm về Trà và Cà phê kèm theo 1 tài khoản Admin để test, hãy chạy:
```bash
node seed.js
```
- **Tài khoản Admin mặc định:** 
  - Username: `tan`
  - Password: `123456`

### 5. Chạy ứng dụng
Chạy lệnh sau để khởi động server:
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3030`

---

## Các chức năng chính
- [x] **Xác thực:** Đăng ký, Đăng nhập, Đăng xuất, Quản lý Hồ sơ.
- [x] **Cửa hàng:** Xem danh sách món, Tìm kiếm theo tên, Lọc theo danh mục và Giá.
- [x] **Chi tiết sản phẩm:** Xem mô tả, hình ảnh và tính toán tổng tiền theo số lượng.
- [x] **Giỏ hàng:** Thêm/Xóa sản phẩm, Cập nhật số lượng.
- [x] **Thanh toán:** Hỗ trợ cổng VNPay và Thanh toán khi nhận hàng.

---

## Cấu trúc thư mục (Rút gọn)
```text
src/
├── config/        # Cấu hình DB (Prisma) và Env
├── middlewares/   # Auth, Error handling
├── modules/       # Logic nghiệp vụ (Auth, Product, Cart, Order, Payment)
├── public/        # CSS, JS client, Images
├── views/         # Giao diện EJS
├── app.js         # Khởi tạo Express
└── server.js      # Điểm bắt đầu của ứng dụng
prisma/
└── schema.prisma  # Định nghĩa Database Model
seed.js            # Script nạp dữ liệu mẫu
```

---

*Chúc bạn có những trải nghiệm tuyệt vời với Coffee Store!*
