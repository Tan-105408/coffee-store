const checkoutService = require("./checkout.service");
const asyncHandler = require("../../middlewares/asyncHandler");
const payOSService = require("../payments/payos.service");
const ordersService = require("../orders/orders.service");

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

  if (paymentMethod === "cash") {
    const order = await checkoutService.createOrder(req.user.id, amount, "cash", cartItems);
    await checkoutService.clearCart(req.user.id);

    const email = req.body.email || req.user.email;
    if (email) {
      ordersService.sendOrderConfirmation(email, {
        orderId: order.id,
        items: cartItems,
        total: amount,
        orderTime: new Date(order.createdAt).toLocaleString("vi-VN"),
        paymentMethod: "cash",
      });
    }

    res.render("checkout_success", {
      transactionId: `COD-${order.id}`,
      orderCode: null,
      orderId: order.id,
      orderTime: new Date(order.createdAt).toLocaleString("vi-VN"),
    });
  } else if (paymentMethod === "payos") {
    const order = await checkoutService.createOrder(req.user.id, amount, "payos", cartItems);
    const paymentResult = await payOSService.generatePaymentUrl(amount, order.id, cartItems);
    await checkoutService.clearCart(req.user.id);
    res.redirect(paymentResult.paymentUrl);
  } else {
    res.status(400).send("Phương thức thanh toán không hợp lệ");
  }
});

module.exports = {
  getCheckout,
  processCheckout,
};
