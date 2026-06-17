const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middlewares/error.middleware");
const optionalAuth = require("./middlewares/optionalAuth.middleware");
const loggingMiddleware = require("./middlewares/logging.middleware");
const Product = require("./models/Product");

const app = express();

// Set up view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loggingMiddleware);
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/auth", require("./modules/auth/auth.routes"));
app.use("/api/products", require("./modules/products/products.routes"));
app.use("/cart", require("./modules/carts/carts.routes"));
app.use("/checkout", require("./modules/checkout/checkout.routes"));
app.use("/payment", require("./modules/payments/payments.routes"));
app.use("/order", require("./modules/orders/orders.routes"));
app.use("/review", require("./modules/reviews/reviews.routes"));

// Backend admin routes (from original app.js)
require("../public/backend")(app);

// Root route (Home)
app.get("/", optionalAuth, async (req, res) => {
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
    res.render("home", {
      products,
      search,
      category,
      minPrice,
      maxPrice,
      user: res.locals.user || null,
    });
  } catch (error) {
    res.status(500).send("Error loading products: " + error.message);
  }
});

// Error handling
app.use(errorHandler);

module.exports = app;
