const checkoutService = require("./checkout.service");
const axios = require("axios");
const asyncHandler = require("../../middlewares/asyncHandler");

const getCheckout = asyncHandler(async (req, res) => {
  const { cartItems, total } = await checkoutService.getCheckoutData(req.user.id);
  res.render("checkout", { cart: cartItems, total });
});

const processCheckout = asyncHandler(async (req, res) => {
  const { paymentMethod } = req.body;
  const { cartItems, total } = await checkoutService.getCheckoutData(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).send("Cart is empty");
  }

  const amount = Math.round(total);
  const baseUrl = `http://localhost:${process.env.PORT || 3030}`;

  if (paymentMethod === "cash") {
    // Save the order to the database
    await checkoutService.createOrder(req.user.id, amount, "cash", cartItems);
    await checkoutService.clearCart(req.user.id);
    res.render("checkout_success", { message: "Đặt hàng thành công! Vui lòng thanh toán khi nhận hàng." });
  } else if (paymentMethod === "vnpay") {
    const response = await axios.post(`${baseUrl}/payment/vnpay`, {
      amount,
      orderId: `VNP_${Date.now()}`,
    });
    // Note: Order should technically be created here as well, 
    // but pending payment status until callback
    await checkoutService.clearCart(req.user.id);
    res.redirect(response.data.paymentUrl);
  } else {
    res.status(400).send("Phương thức thanh toán không hợp lệ");
  }
});

module.exports = {
  getCheckout,
  processCheckout,
};
