const checkoutService = require("./checkout.service");
const axios = require("axios");
const asyncHandler = require("../../middlewares/asyncHandler");

const getCheckout = asyncHandler(async (req, res) => {
  const { cartItems, total } = await checkoutService.getCheckoutData(req.user._id);
  res.render("checkout", { cart: cartItems, total });
});

const processCheckout = asyncHandler(async (req, res) => {
  const { paymentMethod, email, stripeToken } = req.body;
  const { cartItems, total } = await checkoutService.getCheckoutData(req.user._id);

  if (cartItems.length === 0) {
    return res.status(400).send("Cart is empty");
  }

  const orderDetails = cartItems
    .map((item) => `${item.name} x${item.quantity}`)
    .join(", ");
  const amount = Math.round(total);

  // Note: Using absolute URL might be problematic if port changes, but following existing logic
  const baseUrl = `http://localhost:${process.env.PORT || 3030}`;

  if (paymentMethod === "stripe") {
    await axios.post(`${baseUrl}/payment/stripe`, {
      amount,
      token: stripeToken,
      email,
      orderDetails,
    });
    await checkoutService.clearCart(req.user._id);
    res.render("checkout_success", { message: "Payment successful with Stripe!" });
  } else if (paymentMethod === "zalopay") {
    const response = await axios.post(`${baseUrl}/payment/zalopay`, {
      amount,
      orderId: `ZALO_${Date.now()}`,
      email,
      orderDetails,
    });
    await checkoutService.clearCart(req.user._id);
    res.redirect(response.data.data.order_url);
  } else if (paymentMethod === "vnpay") {
    const response = await axios.post(`${baseUrl}/payment/vnpay`, {
      amount,
      orderId: `VNP_${Date.now()}`,
    });
    await checkoutService.clearCart(req.user._id);
    res.redirect(response.data.paymentUrl);
  } else {
    res.status(400).send("Invalid payment method");
  }
});

module.exports = {
  getCheckout,
  processCheckout,
};
