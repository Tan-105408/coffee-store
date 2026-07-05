const asyncHandler = require("../../middlewares/asyncHandler");
const ApiError = require("../../utils/ApiError");
const payOSService = require("./payos.service");
const CheckoutService = require("../checkout/checkout.service");

// Handle PayOS webhook
const handlePayOSWebhook = asyncHandler(async (req, res) => {
  try {
    const webhookData = req.body;

    // Validate webhook data
    if (!webhookData || !webhookData.data || !webhookData.signature) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid webhook data - missing data or signature"
      });
    }

    // Validate required PayOS webhook fields
    const { data } = webhookData;
    if (!data.orderCode || !data.status) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid webhook data - missing orderCode or status"
      });
    }

    console.log("Received PayOS webhook:", {
      orderCode: data.orderCode,
      status: data.status,
      transactionId: data.id,
      signature: webhookData.signature.substring(0, 20) + "..."
    });

    // Process the webhook with PayOS service
    const result = await payOSService.processWebhook(webhookData);

    if (result.status === "SUCCESS") {
      res.json({
        status: "SUCCESS",
        message: result.message
      });
    } else {
      console.error("PayOS webhook processing failed:", result.message);
      res.status(400).json({
        status: "ERROR",
        message: result.message
      });
    }

  } catch (error) {
    console.error("PayOS webhook handler error:", error);

    // Don't expose error details in production
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message;

    res.status(500).json({
      status: "ERROR",
      message: errorMessage
    });
  }
});

// Create PayOS payment for an order
const createPayOSPayment = asyncHandler(async (req, res) => {
  try {
    // Chỉ cần amount từ checkout controller
    const { amount } = req.body;

    if (!amount) {
      throw new ApiError(400, "Amount is required for PayOS payment");
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      throw new ApiError(400, "Invalid amount");
    }

    // Get cart items for PayOS
    const { cartItems, total } = await CheckoutService.getCheckoutData(req.user.id);

    if (cartItems.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    // Save order to database with cart items
    const order = await CheckoutService.createOrder(req.user.id, total, "payos", cartItems);
    const orderIdToUse = order.id;

    // Generate PayOS payment URL
    const paymentResult = await payOSService.generatePaymentUrl(amount, orderIdToUse, cartItems);

    if (!paymentResult.paymentUrl) {
      throw new ApiError(500, "Failed to generate PayOS payment URL");
    }

    // Clear cart AFTER successful PayOS payment generation
    await CheckoutService.clearCart(req.user.id);

    // Return payment URL and details
    res.json({
      paymentUrl: paymentResult.paymentUrl,
      orderId: orderIdToUse,
      paymentId: paymentResult.transactionId,
      status: "PENDING",
      expiresAt: paymentResult.expiresAt,
      orderCode: paymentResult.orderCode || orderIdToUse
    });

  } catch (error) {
    console.error("PayOS payment creation error:", error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: "ERROR",
        message: error.message
      });
    } else {
      res.status(500).json({
        status: "ERROR",
        message: "Failed to create PayOS payment"
      });
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

    // Get payment details
    const paymentDetails = await payOSService.getPaymentDetails(orderId);

    if (!paymentDetails) {
      throw new ApiError(404, `Payment details not found for order: ${orderId}`);
    }

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
      res.status(error.statusCode).json({
        status: "ERROR",
        message: error.message
      });
    } else {
      res.status(500).json({
        status: "ERROR",
        message: "Failed to get payment status"
      });
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

    // Get payment transaction
    const paymentDetails = await payOSService.getPaymentDetails(orderId);

    if (paymentDetails.status === "COMPLETED") {
      throw new ApiError(400, "Cannot cancel completed payment");
    }

    // Update payment status to cancelled
    await payOSService.refundPayment(orderId, 0, "Payment cancelled by user");

    res.json({
      status: "CANCELLED",
      message: "Payment cancelled successfully",
      orderId: orderId
    });

  } catch (error) {
    console.error("Cancel PayOS payment error:", error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        status: "ERROR",
        message: error.message
      });
    } else {
      res.status(500).json({
        status: "ERROR",
        message: "Failed to cancel payment"
      });
    }
  }
});

// Handle PayOS return redirect (user completes payment)
const handlePayOSReturn = asyncHandler(async (req, res) => {
  const { status, orderCode } = req.query;
  if (status === "PAID" || status === "COMPLETED") {
    res.redirect("/?payment=success");
  } else {
    res.redirect("/");
  }
});

// Handle PayOS cancel redirect (user cancels payment)
const handlePayOSCancel = asyncHandler(async (req, res) => {
  console.log("PayOS payment cancelled:", req.query);
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