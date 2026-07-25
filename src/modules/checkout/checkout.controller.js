const checkoutService = require("./checkout.service");
const asyncHandler = require("../../middlewares/asyncHandler");
const payOSService = require("../payments/payos.service");
const ordersService = require("../orders/orders.service");
const { validateVoucher, applyVoucher, checkAutoAssignment } = require("../vouchers/vouchers.service");
const logger = require("../../utils/logger");

const getCheckout = asyncHandler(async (req, res) => {
  const { cartItems, subtotal, promoDiscount, total } = await checkoutService.getCheckoutData(req.user.id);
  const { getUserVouchers } = require("../vouchers/vouchers.service");
  const userVouchers = await getUserVouchers(req.user.id);
  res.render("checkout", { cart: cartItems, subtotal, promoDiscount, total, voucherDiscount: 0, voucherApplied: null, voucherError: null, userVouchers });
});

const processCheckout = asyncHandler(async (req, res) => {
  const { paymentMethod, voucherCode, action } = req.body;
  const { cartItems, subtotal, promoDiscount, total: totalAfterPromo } = await checkoutService.getCheckoutData(req.user.id);
  const { getUserVouchers } = require("../vouchers/vouchers.service");
  const userVouchers = await getUserVouchers(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).send("Cart is empty");
  }

  // Validate voucher (for apply_voucher and checkout with voucher)
  let voucherDiscount = 0;
  let voucherApplied = null;
  if (voucherCode && (action === "apply_voucher" || action === "checkout")) {
    logger.info("voucher.validate", "Validating voucher", { code: voucherCode, userId: req.user.id, totalAfterPromo });
    const validation = await validateVoucher(voucherCode, req.user.id, totalAfterPromo);
    if (!validation.valid) {
      logger.warn("voucher.rejected", "Voucher validation failed", { code: voucherCode, error: validation.error });
      return res.render("checkout", {
        cart: cartItems, subtotal, promoDiscount, total: totalAfterPromo,
        voucherDiscount: 0, voucherApplied: null, voucherError: validation.error, userVouchers,
      });
    }
    voucherDiscount = applyVoucher(validation.voucher, totalAfterPromo);
    voucherApplied = { code: voucherCode };
    logger.info("voucher.applied", "Voucher applied", { code: voucherCode, discount: voucherDiscount, totalAfterPromo });
  }

  // Action: apply_voucher → re-render (show discount, don't create order)
  if (action === "apply_voucher" || action === "remove_voucher") {
    return res.render("checkout", {
      cart: cartItems, subtotal, promoDiscount, total: totalAfterPromo,
      voucherDiscount, voucherApplied, voucherError: null, userVouchers,
    });
  }

  // Action: checkout → create order
  const finalAmount = Math.round(totalAfterPromo - voucherDiscount);

  if (paymentMethod === "cash") {
    const order = await checkoutService.createOrder(req.user.id, finalAmount, "cash", cartItems, voucherCode, voucherDiscount);
    await checkoutService.clearCart(req.user.id);

    checkAutoAssignment(req.user.id, finalAmount).catch(err => console.error("[Voucher] Auto-assign failed:", err));

    const email = req.body.email || req.user.email;
    if (email) {
      ordersService.sendOrderConfirmation(email, {
        orderId: order.id,
        items: cartItems,
        total: finalAmount,
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
    const order = await checkoutService.createOrder(req.user.id, finalAmount, "payos", cartItems, voucherCode, voucherDiscount);
    const paymentResult = await payOSService.generatePaymentUrl(finalAmount, order.id, cartItems);

    checkAutoAssignment(req.user.id, finalAmount).catch(err => console.error("[Voucher] Auto-assign failed:", err));

    res.redirect(paymentResult.paymentUrl);
  } else {
    res.status(400).send("Phương thức thanh toán không hợp lệ");
  }
});

module.exports = { getCheckout, processCheckout };
