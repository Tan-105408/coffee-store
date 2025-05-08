const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB đã kết nối"))
.catch((err) => console.error("❌ Lỗi kết nối MongoDB:", err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const loggingMiddleware = require("./middleware/logginMiddleware");
app.use(loggingMiddleware);

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
}));

const passport = require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// EJS & Public folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/product"));
app.use("/cart", require("./routes/cart"));
app.use("/checkout", require("./routes/checkout"));
app.use("/review", require("./routes/review"));
app.use("/payment", require("./routes/payment"));
app.use("/order", require("./routes/order"));
app.use("/status", require("./routes/status"));
require("./public/backend")(app);

// Trang chủ
app.get("/", async (req, res) => {
  const Product = require("./models/Product");
  const User = require("./models/User");
  const { search, category, minPrice, maxPrice } = req.query;
  let query = {};

  if (search) query.name = { $regex: search, $options: "i" };
  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  try {
    const products = await Product.find(query);

    let user = null;
    if (req.session.token) {
      try {
        const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id).lean();
      } catch (err) {
        console.error("Không thể giải mã token:", err.message);
      }
    }

    res.render("home", { products, search, category, minPrice, maxPrice, user });
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error.message);
    res.status(500).send("Lỗi lấy danh sách sản phẩm: " + error.message);
  }
});

// Trang đăng nhập/đăng ký
app.get("/auth/login", (req, res) => {
  res.render("login");
});

app.get("/auth/register", (req, res) => {
  res.render("register");
});

// Trang giỏ hàng
app.get("/cart", async (req, res) => {
  const cart = req.session.cart || [];
  const Product = require("./models/Product");

  try {
    const populatedCart = await Promise.all(cart.map(async (item) => {
      const product = await Product.findById(item.productId);
      const priceAfterDiscount = product.price * (1 - (product.discount || 0) / 100);
      return {
        product,
        quantity: item.quantity,
        priceAfterDiscount,
        total: priceAfterDiscount * item.quantity,
      };
    }));

    const total = populatedCart.reduce((sum, item) => sum + item.total, 0);

    // Kiểm tra người dùng có trong session không
    let user = null;
    if (req.session.token) {
      try {
        const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id).lean();
      } catch (err) {
        console.error("Không thể giải mã token:", err.message);
      }
    }

    res.render("cart", { cart: populatedCart, total, user });
  } catch (error) {
    console.error("Lỗi khi hiển thị giỏ hàng:", error.message);
    res.status(500).send("Lỗi khi hiển thị giỏ hàng: " + error.message);
  }
});

// Thêm sản phẩm vào giỏ hàng
app.post("/cart/add", async (req, res) => {
  const { productId } = req.body;
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const productIndex = req.session.cart.findIndex((item) => item.productId == productId);
  if (productIndex > -1) {
    req.session.cart[productIndex].quantity += 1;
  } else {
    req.session.cart.push({ productId, quantity: 1 });
  }

  res.json({ success: true, message: "Sản phẩm đã được thêm vào giỏ hàng" });
});

// Trang thanh toán
app.get("/success", (req, res) => {
  req.session.cart = [];
  res.render("checkout_success", { message: "Thanh toán thành công!" });
});

app.get("/cancel", (req, res) => {
  res.render("checkout_cancel", { message: "Thanh toán đã bị hủy." });
});

// Đăng xuất
app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Middleware xử lý lỗi
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// Khởi chạy server
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});
