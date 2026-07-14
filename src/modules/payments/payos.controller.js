const asyncHandler = require("../../middlewares/asyncHandler");
const ApiError = require("../../utils/ApiError");
const payOSService = require("./payos.service");
const CheckoutService = require("../checkout/checkout.service");
const ordersService = require("../orders/orders.service");

// Handle PayOS webhook
const handlePayOSWebhook = asyncHandler(async (req, res) => {
  try {
    const webhookData = req.body;

    if (!webhookData || !webhookData.data || !webhookData.signature) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid webhook data - missing data or signature"
      });
    }

    const { data } = webhookData;
    if (!data.orderCode || !data.status) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid webhook data - missing orderCode or status"
      });
    }

    console.log("PayOS webhook received:", {
      orderCode: data.orderCode,
      status: data.status,
      transactionId: data.id,
    });

    // Verify webhook signature
    const valid = payOSService.verifyWebhookSignature(webhookData);
    if (!valid) {
      console.error("PayOS webhook signature verification FAILED");
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid webhook signature"
      });
    }

    const result = await payOSService.processWebhook(webhookData);

    if (result.status === "SUCCESS") {
      // Gửi email xác nhận fire-and-forget
      if (data.status && ["paid", "success", "completed"].includes(data.status.toLowerCase())) {
        payOSService.getOrderByOrderCode(data.orderCode)
          .then((paymentTx) => {
            if (paymentTx?.order?.user?.email) {
              const order = paymentTx.order;
              const items = order.orderItems.map((oi) => ({
                name: oi.product.name,
                quantity: oi.quantity,
                price: oi.priceAtPurchase,
                total: oi.priceAtPurchase * oi.quantity,
              }));
              ordersService.sendOrderConfirmation(order.user.email, {
                orderId: order.id,
                items,
                total: order.totalAmount,
                orderTime: new Date(order.createdAt).toLocaleString("vi-VN"),
                paymentMethod: "payos",
              });
            }
          })
          .catch((err) => console.error("PayOS email send failed:", err.message));
      }

      res.json({ status: "SUCCESS", message: result.message });
    } else {
      console.error("PayOS webhook processing failed:", result.message);
      res.status(400).json({ status: "ERROR", message: result.message });
    }

  } catch (error) {
    console.error("PayOS webhook handler error:", error);
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message;

    res.status(500).json({ status: "ERROR", message: errorMessage });
  }
});

// Create PayOS payment for an order
const createPayOSPayment = asyncHandler(async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      throw new ApiError(400, "Amount is required for PayOS payment");
    }

    if (isNaN(amount) || amount <= 0) {
      throw new ApiError(400, "Invalid amount");
    }

    const { cartItems, total } = await CheckoutService.getCheckoutData(req.user.id);

    if (cartItems.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    const order = await CheckoutService.createOrder(req.user.id, total, "payos", cartItems);
    const paymentResult = await payOSService.generatePaymentUrl(amount, order.id, cartItems);

    if (!paymentResult.paymentUrl) {
      throw new ApiError(500, "Failed to generate PayOS payment URL");
    }

    await CheckoutService.clearCart(req.user.id);

    res.json({
      paymentUrl: paymentResult.paymentUrl,
      orderId: order.id,
      paymentId: paymentResult.transactionId,
      status: "PENDING",
      expiresAt: paymentResult.expiresAt,
      orderCode: paymentResult.orderCode
    });

  } catch (error) {
    console.error("PayOS payment creation error:", error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ status: "ERROR", message: error.message });
    } else {
      res.status(500).json({ status: "ERROR", message: "Failed to create PayOS payment" });
    }
  }
});

// Get payment status for an order
const getPaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    const paymentDetails = await payOSService.getPaymentDetails(orderId);

    res.json({
      paymentId: paymentDetails.id,
      status: paymentDetails.status,
      amount: paymentDetails.amount,
      provider: paymentDetails.provider,
      paidAt: paymentDetails.paidAt,
      errorCode: paymentDetails.errorCode,
      errorMessage: paymentDetails.errorMessage,
      updatedAt: paymentDetails.updatedAt
    });

  } catch (error) {
    console.error("Get PayOS payment status error:", error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ status: "ERROR", message: error.message });
    } else {
      res.status(500).json({ status: "ERROR", message: "Failed to get payment status" });
    }
  }
});

// Cancel PayOS payment
const cancelPayOSPayment = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    const paymentDetails = await payOSService.getPaymentDetails(orderId);

    if (paymentDetails.status === "COMPLETED") {
      throw new ApiError(400, "Cannot cancel completed payment");
    }

    await payOSService.refundPayment(orderId, 0, "Payment cancelled by user");

    res.json({
      status: "CANCELLED",
      message: "Payment cancelled successfully",
      orderId: orderId
    });

  } catch (error) {
    console.error("Cancel PayOS payment error:", error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ status: "ERROR", message: error.message });
    } else {
      res.status(500).json({ status: "ERROR", message: "Failed to cancel payment" });
    }
  }
});

// Handle PayOS return redirect — query DB by orderCode
const handlePayOSReturn = asyncHandler(async (req, res) => {
  const { code, status, cancel, orderCode } = req.query;

  console.log("PayOS Return:", req.query);

  // Fetch payment + order from DB using orderCode
  const paymentTx = await payOSService.getOrderByOrderCode(orderCode);

  if (!paymentTx) {
    return res.render("checkout_failed", {
      message: "Không tìm thấy thông tin đơn hàng."
    });
  }

  const order = paymentTx.order;

  if (
    code === "00" &&
    cancel === "false" &&
    (status === "PAID" || status === "COMPLETED")
  ) {
    // Gửi email xác nhận cho PayOS return (fire-and-forget)
    if (order?.user?.email) {
      const items = order.orderItems.map((oi) => ({
        name: oi.product.name,
        quantity: oi.quantity,
        price: oi.priceAtPurchase,
        total: oi.priceAtPurchase * oi.quantity,
      }));
      ordersService.sendOrderConfirmation(order.user.email, {
        orderId: order.id,
        items,
        total: order.totalAmount,
        orderTime: new Date(order.createdAt).toLocaleString("vi-VN"),
        paymentMethod: "payos",
      });
    }

    return res.render("checkout_success", {
      transactionId: paymentTx.transactionId || orderCode,
      orderCode: orderCode,
      orderId: order.id,
      orderTime: order.createdAt
        ? new Date(order.createdAt).toLocaleString("vi-VN")
        : new Date().toLocaleString("vi-VN")
    });
  }

  return res.render("checkout_failed", {
    message: "Thanh toán không thành công hoặc đã bị hủy."
  });
});

// Handle PayOS cancel redirect
const handlePayOSCancel = asyncHandler(async (req, res) => {
  const { orderCode } = req.query;
  console.log("PayOS payment cancelled:", req.query);

  if (orderCode) {
    await payOSService.cancelByOrderCode(orderCode);
  }

  res.redirect("/");
});

module.exports = {
  createPayOSPayment,
  handlePayOSWebhook,
  getPaymentStatus,
  cancelPayOSPayment,
  handlePayOSReturn,
  handlePayOSCancel
};
