const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3030,
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  payos: {
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    returnUrl: process.env.PAYOS_RETURN_URL || `http://localhost:${process.env.PORT || 3030}/payment/payos/return`,
    cancelUrl: process.env.PAYOS_CANCEL_URL || `http://localhost:${process.env.PORT || 3030}/payment/payos/cancel`,
    webhookSecret: process.env.PAYOS_WEBHOOK_SECRET,
  },
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};
