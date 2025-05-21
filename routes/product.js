const express = require("express");
const Product = require("../models/Product");
const Review = require("../models/Review");
const router = express.Router();

router.get("/", async (req, res) => {
  const { search, category, minPrice, maxPrice } = req.query;
  let query = {};
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  if (category) {
    query.category = category;
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  try {
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách sản phẩm", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    const reviews = await Review.find({ productId: id }).populate("userId", "username");
    res.render("product-detail", { product, reviews, user: req.user || null });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết sản phẩm", error: error.message });
  }
});

router.post("/add", async (req, res) => {
  const { name, price, image, category, discount } = req.body;
  try {
    const product = new Product({ name, price, image, category, discount });
    await product.save();
    res.json({ message: "Sản phẩm đã được thêm", product });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thêm sản phẩm", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.json({ message: "Sản phẩm đã được cập nhật", product });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật sản phẩm", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.json({ message: "Sản phẩm đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa sản phẩm", error: error.message });
  }
});

module.exports = router;