const express = require("express");
const payOSController = require("./payos.controller");
const asyncHandler = require("../../middlewares/asyncHandler");

const router = express.Router();

// Create PayOS payment for an order
// POST /payment/payos
router.post("/", payOSController.createPayOSPayment);

// Handle PayOS webhook
// POST /payment/payos/webhook
router.post("/webhook", payOSController.handlePayOSWebhook);

// Get payment status
// GET /payment/payos/status/:orderId
router.get("/status/:orderId", payOSController.getPaymentStatus);

// Cancel PayOS payment
// POST /payment/payos/cancel
router.post("/cancel", payOSController.cancelPayOSPayment);

// Handle PayOS return redirect (browser GET)
// GET /payment/payos/return
router.get("/return", payOSController.handlePayOSReturn);

// Handle PayOS cancel redirect (browser GET)
// GET /payment/payos/cancel
router.get("/cancel", payOSController.handlePayOSCancel);

module.exports = router;