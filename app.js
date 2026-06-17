// // app.js

// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const session = require("express-session");
// const path = require("path");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const jwt = require("jsonwebtoken");

// dotenv.config();

// const app = express();

// // -------------------- KẾT NỐI CSDL --------------------
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("✅ MongoDB đã kết nối"))
//   .catch((err) => console.error("❌ Lỗi kết nối MongoDB:", err));

// // -------------------- MIDDLEWARE CƠ BẢN --------------------
// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Middleware ghi log (nếu cần)
// const loggingMiddleware = require("./middleware/logginMiddleware");
// app.use(loggingMiddleware);

// // -------------------- CẤU HÌNH SESSION --------------------
// // Sử dụng secret từ biến môi trường cho bảo mật phiên
// app.use(
//   session({
//     secret: process.env.JWT_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     // Nếu cần cấu hình thêm cookie (ví dụ: thời gian tồn tại, secure)
//     // cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
//   })
// );

// // -------------------- PASSPORT & ATTACH USER --------------------
// const passport = require("./config/passport");
// app.use(passport.initialize());
// app.use(passport.session());

// // Middleware attachUser: tự động gán thông tin người dùng (nếu có) vào res.locals
// const attachUser = require("./middleware/attachUser");
// app.use(attachUser);

// // -------------------- CẤU HÌNH VIEW ENGINE & STATIC FILES --------------------
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));
// app.use(express.static(path.join(__dirname, "public")));

// // -------------------- MOUNT ROUTERS --------------------
// app.use("/auth", require("./routes/auth"));
// app.use("/api/products", require("./routes/product"));
// app.use("/cart", require("./routes/cart"));       // Định nghĩa API giỏ hàng ở file: routes/cart.js
// app.use("/checkout", require("./routes/checkout"));
// app.use("/review", require("./routes/review"));
// app.use("/payment", require("./routes/payment"));
// app.use("/order", require("./routes/order"));
// app.use("/status", require("./routes/status"));

// // Nếu có backend admin được cấu hình trong public, mount các route backend đó
// require("./public/backend")(app);

// // -------------------- ROUTE TRANG CHỦ --------------------
// app.get("/", async (req, res) => {
//   const Product = require("./models/Product");
//   const { search, category, minPrice, maxPrice } = req.query;
//   let query = {};

//   // Tạo điều kiện tìm kiếm sản phẩm dựa vào query params
//   if (search) query.name = { $regex: search, $options: "i" };
//   if (category) query.category = category;
//   if (minPrice || maxPrice) {
//     query.price = {};
//     if (minPrice) query.price.$gte = Number(minPrice);
//     if (maxPrice) query.price.$lte = Number(maxPrice);
//   }

//   try {
//     const products = await Product.find(query);
//     // Sử dụng res.locals.user được gán bởi middleware attachUser
//     res.render("home", {
//       products,
//       search,
//       category,
//       minPrice,
//       maxPrice,
//       user: res.locals.user,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy danh sách sản phẩm:", error.message);
//     res.status(500).send("Lỗi lấy danh sách sản phẩm: " + error.message);
//   }
// });

// // -------------------- ERROR HANDLING MIDDLEWARE --------------------
// const errorHandler = require("./middleware/errorHandler");
// app.use(errorHandler);

// // -------------------- KHỞI CHẠY SERVER --------------------
// const PORT = process.env.PORT || 3030;
// app.listen(PORT, () => {
//   console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
// });
