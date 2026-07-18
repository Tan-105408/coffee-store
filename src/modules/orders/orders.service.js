const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOrderConfirmation = async (email, orderData) => {
  try {
    const { orderId, items, total, orderTime, paymentMethod } = orderData;

    const paymentLabel = paymentMethod === "payos" ? "PayOS" : "Tiền mặt (COD)";

    const itemsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${Number(item.price).toLocaleString("vi-VN")}đ</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${Number(item.total).toLocaleString("vi-VN")}đ</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#2a9d8f">Xác nhận đơn hàng #${orderId}</h2>
        <p>Cảm ơn bạn đã đặt hàng tại Coffee Store!</p>
        <p><strong>Phương thức thanh toán:</strong> ${paymentLabel}</p>
        <p><strong>Thời gian:</strong> ${orderTime}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:left">Sản phẩm</th>
              <th style="padding:8px;text-align:center">SL</th>
              <th style="padding:8px;text-align:right">Đơn giá</th>
              <th style="padding:8px;text-align:right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="font-size:18px;font-weight:bold;text-align:right;color:#2a9d8f">
          Tổng cộng: ${Number(total).toLocaleString("vi-VN")}đ
        </p>
        <hr/>
        <p style="color:#888;font-size:12px">Đây là email tự động. Vui lòng không reply.</p>
      </div>`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Xác nhận đơn hàng #${orderId} - Coffee Store`,
      html,
    });

    console.log(`Email sent for order #${orderId} to ${email}`);
  } catch (error) {
    console.error("Failed to send order confirmation email:", error.message);
  }
};

const { prisma } = require("../../config/db");

const getOrdersByUserId = async (userId) => {
  return await prisma.order.findMany({
    where: { userId: parseInt(userId) },
    include: {
      orderItems: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

module.exports = { sendOrderConfirmation, getOrdersByUserId };
