const paymentService = require("./payments.service");
const orderService = require("../orders/orders.service");
const asyncHandler = require("../../middlewares/asyncHandler");

const payWithStripe = asyncHandler(async (req, res) => {
  const { amount, token, email, orderDetails } = req.body;
  const charge = await paymentService.processStripePayment(amount, token);
  await orderService.sendOrderConfirmation(email, orderDetails);
  res.json({ message: "Stripe payment successful", charge });
});

const payWithZaloPay = asyncHandler(async (req, res) => {
  const { amount, orderId, email, orderDetails } = req.body;
  const response = await paymentService.processZaloPayPayment(amount, orderId);
  await orderService.sendOrderConfirmation(email, orderDetails);
  res.json({ message: "ZaloPay payment initiated", data: response.data });
});

const payWithVNPay = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;
  const paymentUrl = paymentService.generateVNPayUrl(amount, orderId);
  res.json({ message: "VNPay payment URL generated", paymentUrl });
});

module.exports = {
  payWithStripe,
  payWithZaloPay,
  payWithVNPay,
};
