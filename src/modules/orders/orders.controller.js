const orderService = require("./orders.service");
const asyncHandler = require("../../middlewares/asyncHandler");

const confirmOrder = asyncHandler(async (req, res) => {
  const { email, orderDetails } = req.body;
  await orderService.sendOrderConfirmation(email, orderDetails);
  res.json({ message: "Order confirmation email sent!" });
});

const getOrderHistory = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrdersByUserId(req.user.id);
  res.render("order-history", { orders, user: req.user });
});

module.exports = {
  confirmOrder,
  getOrderHistory,
};
