const express = require("express");
const paymentController = require("./payments.controller");
const router = express.Router();

router.post("/vnpay", paymentController.payWithVNPay);

module.exports = router;
