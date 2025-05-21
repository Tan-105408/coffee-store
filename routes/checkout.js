const express = require("express");
const router = express.Router();
const axios = require("axios");
const verifyToken = require("../middleware/verifyToken");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// GET /checkout - Lấy giỏ hàng từ CSDL và render trang thanh toán
router.get("/", verifyToken, async (req, res) => {
  try {
    // Truy vấn giỏ hàng của user từ DB, populate thông tin chi tiết sản phẩm
    const cart = await Cart.findOne({ userId: req.userId }).populate("items.productId");
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.render("checkout", { cart: [], total: 0 });
    }

    // Tính giá sau giảm và tổng tiền cho từng mục trong giỏ hàng
    const populatedCart = cart.items.map((item) => {
      const product = item.productId;
      // Ép về số để đảm bảo tính toán chính xác
      const price = Number(product.price) || 0;
      const discount = Number(product.discount) || 0;
      const priceAfterDiscount = price * (1 - discount / 100);
      return {
        name: product.name,
        price: priceAfterDiscount,
        quantity: item.quantity,
        total: priceAfterDiscount * item.quantity,
      };
    });
    const total = populatedCart.reduce((sum, item) => sum + item.total, 0);
    // Lưu tổng tiền vào session nếu cần dùng lại trong POST thanh toán
    req.session.total = total;
    res.render("checkout", { cart: populatedCart, total });
  } catch (error) {
    console.error("Lỗi khi tải trang thanh toán:", error);
    res.status(500).send("Lỗi khi tải trang thanh toán");
  }
});

// POST /checkout - Xử lý thanh toán
router.post("/", verifyToken, async (req, res) => {
  const { paymentMethod, email, stripeToken } = req.body;
  
  try {
    // Lấy lại giỏ hàng từ DB để đảm bảo tính nhất quán và tính tổng chính xác
    const cart = await Cart.findOne({ userId: req.userId }).populate("items.productId");
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).send("Giỏ hàng trống");
    }
    
    const populatedCart = cart.items.map((item) => {
      const product = item.productId;
      const price = Number(product.price) || 0;
      const discount = Number(product.discount) || 0;
      const priceAfterDiscount = price * (1 - discount / 100);
      return {
        name: product.name,
        price: priceAfterDiscount,
        quantity: item.quantity,
        total: priceAfterDiscount * item.quantity,
      };
    });
    const total = populatedCart.reduce((sum, item) => sum + item.total, 0);
    req.session.total = total;
    const orderDetails = populatedCart
      .map((item) => `${item.name} x${item.quantity}`)
      .join(", ");
    const amount = Math.round(total);

    if (paymentMethod === "stripe") {
      const response = await axios.post("http://localhost:3000/payment/stripe", {
        amount,
        token: stripeToken,
        email,
        orderDetails,
      });
      // Sau khi thanh toán thành công, xóa giỏ hàng trong CSDL (hoặc cập nhật trạng thái)
      // Ở đây anh có thể xóa cart hoặc chuyển sang trạng thái "đã thanh toán" tùy theo thiết kế
      await Cart.findOneAndUpdate({ userId: req.userId }, { items: [] });
      res.render("checkout_success", {
        message: "Thanh toán thành công qua Stripe!",
      });
    } else if (paymentMethod === "zalopay") {
      const response = await axios.post("http://localhost:3000/payment/zalopay", {
        amount,
        orderId: `ZALO_${Date.now()}`,
        email,
        orderDetails,
      });
      await Cart.findOneAndUpdate({ userId: req.userId }, { items: [] });
      res.redirect(response.data.data.order_url);
    } else if (paymentMethod === "vnpay") {
      const response = await axios.post("http://localhost:3000/payment/vnpay", {
        amount,
        orderId: `VNP_${Date.now()}`,
      });
      await Cart.findOneAndUpdate({ userId: req.userId }, { items: [] });
      res.redirect(response.data.paymentUrl);
    } else {
      res.status(400).send("Phương thức thanh toán không hợp lệ");
    }
  } catch (error) {
    console.error("Lỗi khi xử lý thanh toán:", error);
    res.status(500).send("Đã xảy ra lỗi khi xử lý thanh toán: " + error.message);
  }
});

module.exports = router;
