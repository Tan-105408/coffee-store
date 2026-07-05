const checkoutService = require("./checkout.service");
const asyncHandler = require("../../middlewares/asyncHandler");
const payOSService = require("../payments/payos.service");

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
    await checkoutService.createOrder(req.user.id, amount, "cash", cartItems);
    await checkoutService.clearCart(req.user.id);
    res.render("checkout_success", {
      message: "Đặt hàng thành công! Vui lòng thanh toán khi nhận hàng."
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
