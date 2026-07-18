const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const optionalAuth = require("./middlewares/optionalAuth.middleware");
const loggingMiddleware = require("./middlewares/logging.middleware");
const { prisma } = require("./config/db");
const { requestLogger, errorMiddleware } = require("./utils/logger");

const app = express();

// Disable ETag to prevent admin stale-cache issues
app.set("etag", false);

// Set up view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "coffee-store-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  },
}));
app.use(loggingMiddleware);
app.use(requestLogger);
app.use(express.static(path.join(__dirname, "public")));

// Global optionalAuth — makes res.locals.user available to all views
app.use(optionalAuth);

// Routes
app.use("/auth", require("./modules/auth/auth.routes"));
app.use("/api/products", require("./modules/products/products.routes"));
app.use("/cart", require("./modules/carts/carts.routes"));
app.use("/checkout", require("./modules/checkout/checkout.routes"));
app.use("/payment/payos", require("./modules/payments/payos.routes"));
app.use("/order", require("./modules/orders/orders.routes"));
app.use("/review", require("./modules/reviews/reviews.routes"));

app.use("/admin", require("./modules/admin/admin.routes"));

// Root route (Home)
app.get("/", optionalAuth, async (req, res) => {
  const { search, category, minPrice, maxPrice } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 8;

  let where = {};
  if (category) {
    where.category = category;
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  try {
    let products = await prisma.product.findMany({ where });
    // SQL Server Prisma không hỗ trợ mode: "insensitive" → filter bằng JS
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Phân trang
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const offset = (page - 1) * limit;
    const paginatedProducts = products.slice(offset, offset + limit);

    // Best seller products (chỉ lấy khi không search/filter)
    const bestSellers = (!search && !category && !minPrice && !maxPrice)
      ? await prisma.product.findMany({ where: { isBestSeller: true }, take: 8 })
      : [];
    // Promo products (Coffee for Life etc.)
    const promoProducts = (!search && !category && !minPrice && !maxPrice)
      ? await prisma.product.findMany({ where: { promoTag: { not: null } }, take: 5 })
      : [];

    // Build query string cho pagination links (giữ nguyên search/filter)
    const queryParams = new URLSearchParams();
    if (search) queryParams.set('search', search);
    if (category) queryParams.set('category', category);
    if (minPrice) queryParams.set('minPrice', minPrice);
    if (maxPrice) queryParams.set('maxPrice', maxPrice);
    const baseQuery = queryParams.toString();

    res.render("home", {
      products: paginatedProducts,
      bestSellers,
      promoProducts,
      search,
      category,
      minPrice,
      maxPrice,
      user: res.locals.user || null,
      payment: req.query.payment || null,
      currentPage: page,
      totalPages,
      totalProducts,
      baseQuery,
    });
  } catch (error) {
    res.status(500).send("Error loading products: " + error.message);
  }
});

// Error handling — logs errors then delegates to existing handler
app.use(errorMiddleware);

module.exports = app;
