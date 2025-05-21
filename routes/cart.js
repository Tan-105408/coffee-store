// routes/cart.js

const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

/**
 * Route POST /cart/add
 * Thêm sản phẩm vào giỏ hàng của người dùng.
 * Nếu giỏ hàng chưa tồn tại thì tạo mới;
 * nếu sản phẩm đã có thì tăng số lượng.
 */
router.post("/add", verifyToken, async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  // Kiểm tra xem productId có được truyền vào hay không
  if (!productId) {
    return res.status(400).json({ message: "Sản phẩm không xác định" });
  }

  try {
    // Tìm giỏ hàng của người dùng dựa theo req.userId do verifyToken thiết lập
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }

    // Tìm xem sản phẩm đã có trong giỏ chưa (so sánh chuỗi)
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex >= 0) {
      // Nếu sản phẩm đã có, tăng số lượng
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Nếu chưa có, thêm sản phẩm với số lượng khởi tạo là quantity
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    return res.json({
      success: true,
      message: "Sản phẩm đã được thêm vào giỏ hàng",
      cart,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi thêm sản phẩm vào giỏ", error: error.message });
  }
});

/**
 * Route GET /
 * Lấy giỏ hàng của người dùng và hiển thị (render view) giỏ hàng.
 * Sử dụng populate để lấy thông tin chi tiết của từng sản phẩm.
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    // Tìm giỏ hàng của user và populate thông tin sản phẩm (trường productId)
    const cart = await Cart.findOne({ userId: req.userId }).populate("items.productId");
    if (!cart || !cart.items || cart.items.length === 0) {
      // Nếu giỏ hàng chưa có sản phẩm, render view với mảng rỗng và tổng = 0
      return res.render("cart", { cart: [], total: 0 });
    }

    // Tính giá sau giảm và tổng tiền cho từng mục trong giỏ hàng
    const cartItems = cart.items.map((item) => {
      const priceAfterDiscount =
        item.productId.price * (1 - (item.productId.discount || 0) / 100);
      return {
        product: item.productId,
        quantity: item.quantity,
        priceAfterDiscount,
        total: priceAfterDiscount * item.quantity,
      };
    });

    // Tổng cộng tiền giỏ hàng
    const total = cartItems.reduce((sum, item) => sum + item.total, 0);

    res.render("cart", { cart: cartItems, total });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi lấy giỏ hàng", error: error.message });
  }
});

/**
 * Route DELETE /cart/remove/:productId
 * Xóa sản phẩm khỏi giỏ hàng dựa theo productId.
 */
router.delete("/remove/:productId", verifyToken, async (req, res) => {
  const { productId } = req.params;

  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }

    // Lọc bỏ sản phẩm được xóa khỏi mảng items
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();
    return res.json({
      success: true,
      message: "Sản phẩm đã được xóa khỏi giỏ hàng",
      cart,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi xóa sản phẩm khỏi giỏ", error: error.message });
  }
});

module.exports = router;
