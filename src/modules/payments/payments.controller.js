const paymentService = require("./payments.service");
const orderService = require("../orders/orders.service");
const asyncHandler = require("../../middlewares/asyncHandler");

const payWithVNPay = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;
  const paymentUrl = paymentService.generateVNPayUrl(amount, orderId);
  res.json({ message: "VNPay payment URL generated", paymentUrl });
});

module.exports = {
  payWithVNPay,
};
