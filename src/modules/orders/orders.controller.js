const orderService = require("./orders.service");
const asyncHandler = require("../../middlewares/asyncHandler");

const confirmOrder = asyncHandler(async (req, res) => {
  const { email, orderDetails } = req.body;
  await orderService.sendOrderConfirmation(email, orderDetails);
  res.json({ message: "Order confirmation email sent!" });
});

module.exports = {
  confirmOrder,
};
