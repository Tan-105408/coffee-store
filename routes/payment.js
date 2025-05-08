const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");
const crypto = require("crypto");
const querystring = require("querystring");
const router = express.Router();

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

async function sendConfirmationEmail(email, orderDetails) {
  try {
    await axios.post("http://localhost:3000/order/confirm", { email, orderDetails });
  } catch (error) {
    console.error("Lỗi gửi email xác nhận:", error.message);
  }
}

router.post("/stripe", async (req, res) => {
  const { amount, token, email, orderDetails } = req.body;
  try {
    const charge = await stripe.charges.create({
      amount,
      currency: "vnd",
      source: token,
      description: "Thanh toán qua Stripe",
    });
    await sendConfirmationEmail(email, orderDetails);
    res.json({ message: "Thanh toán thành công qua Stripe", charge });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thanh toán Stripe", error: error.message });
  }
});

router.post("/zalopay", async (req, res) => {
  const { amount, orderId, email, orderDetails } = req.body;
  const zaloPayConfig = {
    app_id: process.env.ZALO_APP_ID,
    key1: process.env.ZALO_KEY1,
    key2: process.env.ZALO_KEY2,
  };
  const order = {
    app_id: zaloPayConfig.app_id,
    app_trans_id: `${Date.now()}`,
    app_user: "KhachHang01",
    app_time: Date.now(),
    item: "[]",
    embed_data: "{}",
    amount,
    description: `Thanh toán đơn hàng #${orderId}`,
    bank_code: "zalopayapp",
    callback_url: "http://localhost:3000/payment/zalopay/callback",
  };
  const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  order.mac = crypto.createHmac("sha256", zaloPayConfig.key1).update(data).digest("hex");
  try {
    const response = await axios.post("https://sandbox.zalopay.vn/v2/create", order);
    await sendConfirmationEmail(email, orderDetails);
    res.json({ message: "Thanh toán qua ZaloPay", data: response.data });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thanh toán qua ZaloPay", error: error.message });
  }
});

router.post("/vnpay", (req, res) => {
  const { amount, orderId } = req.body;
  const vnpConfig = {
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_HashSecret: process.env.VNP_HASH_SECRET,
    vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_ReturnUrl: "http://localhost:3000/payment/vnpay/return",
  };
  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: vnpConfig.vnp_TmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toán đơn hàng #${orderId}`,
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: vnpConfig.vnp_ReturnUrl,
    vnp_IpAddr: "127.0.0.1",
    vnp_CreateDate: new Date().toISOString().replace(/[-T:\.Z]/g, "").slice(0, 14),
  };
  vnp_Params = sortObject(vnp_Params);
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const secureHash = crypto.createHmac("sha512", vnpConfig.vnp_HashSecret)
    .update(signData)
    .digest("hex");
  vnp_Params.vnp_SecureHash = secureHash;
  const paymentUrl = `${vnpConfig.vnp_Url}?${querystring.stringify(vnp_Params, { encode: true })}`;
  res.json({ message: "Thanh toán qua VNPay", paymentUrl });
});

module.exports = router;