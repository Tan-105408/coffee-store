const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/", async (req, res) => {
  const cart = req.session.cart || [];
  const Product = require("../models/Product");
  try {
    const populatedCart = await Promise.all(
      cart.map(async (item) => {
        const product = await Product.findById(item.productId);
        const priceAfterDiscount = product.price * (1 - (product.discount || 0) / 100);
        return {
          name: product.name,
          price: priceAfterDiscount,
          quantity: item.quantity,
          total: priceAfterDiscount * item.quantity,
        };
      })
    );
    const total = populatedCart.reduce((sum, item) => sum + item.total, 0);
    req.session.total = total;
    res.render("checkout", { cart: populatedCart, total });
  } catch (error) {
    res.status(500).send("Lỗi khi tải trang thanh toán");
  }
});

router.post("/", async (req, res) => {
  const { paymentMethod, email, stripeToken } = req.body;
  const cart = req.session.cart || [];
  const total = req.session.total || 0;
  const orderDetails = cart.map((item) => `${item.name} x${item.quantity}`).join(", ");
  const amount = Math.round(total);
  try {
    if (paymentMethod === "stripe") {
      const response = await axios.post("http://localhost:3000/payment/stripe", {
        amount,
        token: stripeToken,
        email,
        orderDetails,
      });
      req.session.cart = [];
      res.render("checkout_success", { message: "Thanh toán thành công qua Stripe!" });
    } else if (paymentMethod === "zalopay") {
      const response = await axios.post("http://localhost:3000/payment/zalopay", {
        amount,
        orderId: `ZALO_${Date.now()}`,
        email,
        orderDetails,
      });
      req.session.cart = [];
      res.redirect(response.data.data.order_url);
    } else if (paymentMethod === "vnpay") {
      const response = await axios.post("http://localhost:3000/payment/vnpay", {
        amount,
        orderId: `VNP_${Date.now()}`,
      });
      req.session.cart = [];
      res.redirect(response.data.paymentUrl);
    } else {
      res.status(400).send("Phương thức thanh toán không hợp lệ");
    }
  } catch (error) {
    res.status(500).send("Đã xảy ra lỗi khi xử lý thanh toán: " + error.message);
  }
});

module.exports = router;