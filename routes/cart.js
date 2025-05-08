const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.post("/add", verifyToken, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }
    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    if (itemIndex >= 0) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    await cart.save();
    res.json({ success: true, message: "Sản phẩm đã được thêm vào giỏ hàng", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thêm sản phẩm vào giỏ", error: error.message });
  }
});

router.get("/cart", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId }).populate("items.productId");
    if (!cart) {
      return res.json({ items: [], total: 0 });
    }
    const cartWithTotal = {
      items: cart.items.map((item) => {
        const priceAfterDiscount = item.productId.price * (1 - (item.productId.discount || 0) / 100);
        return {
          product: item.productId,
          quantity: item.quantity,
          priceAfterDiscount,
          total: priceAfterDiscount * item.quantity,
        };
      }),
      total: cart.items.reduce((sum, item) => {
        const priceAfterDiscount = item.productId.price * (1 - (item.productId.discount || 0) / 100);
        return sum + priceAfterDiscount * item.quantity;
      }, 0),
    };
    res.render("cart", { cart: cartWithTotal.items, total: cartWithTotal.total });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy giỏ hàng", error: error.message });
  }
});

router.delete("/remove/:productId", verifyToken, async (req, res) => {
  const { productId } = req.params;
  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }
    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();
    res.json({ success: true, message: "Sản phẩm đã được xóa khỏi giỏ hàng", cart });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa sản phẩm khỏi giỏ", error: error.message });
  }
});

module.exports = router;