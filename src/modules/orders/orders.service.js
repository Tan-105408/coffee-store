const nodemailer = require("nodemailer");

const sendOrderConfirmation = async (email, orderDetails) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Xác nhận đơn hàng",
    text: `Cảm ơn bạn đã đặt hàng! Đơn hàng gồm: ${orderDetails}`,
  });
};

module.exports = {
  sendOrderConfirmation,
};
