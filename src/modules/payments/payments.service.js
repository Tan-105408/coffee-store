const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");
const crypto = require("crypto");
const querystring = require("querystring");

const processStripePayment = async (amount, token) => {
  return await stripe.charges.create({
    amount,
    currency: "vnd",
    source: token,
    description: "Coffee Store Payment",
  });
};

const processZaloPayPayment = async (amount, orderId) => {
  const zaloPayConfig = {
    app_id: process.env.ZALO_APP_ID,
    key1: process.env.ZALO_KEY1,
  };
  const order = {
    app_id: zaloPayConfig.app_id,
    app_trans_id: `${Date.now()}`,
    app_user: "User",
    app_time: Date.now(),
    item: "[]",
    embed_data: "{}",
    amount,
    description: `Order #${orderId}`,
    bank_code: "zalopayapp",
    callback_url: "http://localhost:3000/payment/zalopay/callback",
  };
  const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  order.mac = crypto.createHmac("sha256", zaloPayConfig.key1).update(data).digest("hex");
  return await axios.post("https://sandbox.zalopay.vn/v2/create", order);
};

const generateVNPayUrl = (amount, orderId) => {
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
    vnp_OrderInfo: `Order #${orderId}`,
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: vnpConfig.vnp_ReturnUrl,
    vnp_IpAddr: "127.0.0.1",
    vnp_CreateDate: new Date().toISOString().replace(/[-T:\.Z]/g, "").slice(0, 14),
  };
  
  const sortObject = (obj) => {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  };

  vnp_Params = sortObject(vnp_Params);
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const secureHash = crypto.createHmac("sha512", vnpConfig.vnp_HashSecret)
    .update(signData)
    .digest("hex");
  vnp_Params.vnp_SecureHash = secureHash;
  return `${vnpConfig.vnp_Url}?${querystring.stringify(vnp_Params, { encode: true })}`;
};

module.exports = {
  processStripePayment,
  processZaloPayPayment,
  generateVNPayUrl,
};
