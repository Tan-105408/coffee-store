const axios = require("axios");
const crypto = require("crypto");
const querystring = require("querystring");

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
  generateVNPayUrl,
};
