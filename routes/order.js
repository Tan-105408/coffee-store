const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

router.post("/confirm", async (req, res) => {
  const { email, orderDetails } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Xác nhận đơn hàng",
      text: `Cảm ơn bạn đã đặt hàng! Đơn hàng gồm: ${orderDetails}`,
    });
    res.json({ message: "Email xác nhận đã gửi!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gửi email", error: error.message });
  }
});

module.exports = router;