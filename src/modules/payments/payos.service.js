const { prisma } = require("../../config/db");
const axios = require("axios");
const crypto = require("crypto");
const ApiError = require("../../utils/ApiError");

const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, PAYOS_RETURN_URL, PAYOS_CANCEL_URL } = process.env;

if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
  throw new Error("PayOS environment variables are not properly configured");
}

class PayOSService {
  constructor() {
    this.clientId = PAYOS_CLIENT_ID;
    this.apiKey = PAYOS_API_KEY;
    this.checksumKey = PAYOS_CHECKSUM_KEY;
    this.baseUrl = `http://localhost:${process.env.PORT || 3030}`;
    this.returnUrl = PAYOS_RETURN_URL || `${this.baseUrl}/payment/payos/return`;
    this.cancelUrl = PAYOS_CANCEL_URL || `${this.baseUrl}/payment/payos/cancel`;
  }

  // Generate PayOS payment URL for an order
  async generatePaymentUrl(amount, orderId, items = []) {
    try {
      if (!orderId) {
        throw new ApiError(400, "Order ID is required for PayOS payment generation");
      }

      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) }
      });

      if (!order) {
        throw new ApiError(404, `Order not found: ${orderId}`);
      }

      if (order.status?.toUpperCase() !== "PENDING") {
        throw new ApiError(400, `Order status is not pending. Current status: ${order.status}`);
      }

      const payosItems = items.map(item => ({
        name: item.name || `Product ${item.productId || ''}`,
        quantity: item.quantity || 1,
        price: item.price || 0
      }));

      const orderCode = Date.now();

      const payload = {
        orderCode,
        amount,
        description: `DH${orderId}`,
        items: payosItems,
        returnUrl: this.returnUrl,
        cancelUrl: this.cancelUrl,
        expiredAt: Math.floor(Date.now() / 1000) + (30 * 60)
      };

      payload.signature = this.generateSignature(payload);

      const response = await axios.post("https://api-merchant.payos.vn/v2/payment-requests", payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
          'x-api-key': this.apiKey
        }
      });

      const paymentData = response.data;

      if (paymentData.code !== "00") {
        console.error("PayOS API error:", paymentData.desc, paymentData);
        throw new ApiError(400, `PayOS API error: ${paymentData.desc || "Unknown error"}`);
      }

      if (!paymentData.data?.checkoutUrl) {
        console.error("PayOS response missing checkoutUrl:", paymentData);
        throw new ApiError(500, "PayOS did not return a checkout URL");
      }

      // Create payment transaction WITH orderCode saved
      await prisma.paymentTransaction.create({
        data: {
          orderId: parseInt(orderId),
          orderCode: orderCode.toString(),
          provider: "payos",
          status: "pending",
          transactionId: paymentData.data?.id?.toString(),
          amount: amount,
          currency: "VND",
          errorCode: paymentData.code?.toString(),
          errorMessage: paymentData.desc || null
        }
      });

      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: {
          status: "processing",
          paymentMethod: "payos",
          paymentStatus: "pending"
        }
      });

      return {
        paymentUrl: paymentData.data?.checkoutUrl,
        orderCode: orderCode,
        transactionId: paymentData.data?.id?.toString(),
        status: "PENDING",
        expiresAt: paymentData.data?.expiredAt
      };

    } catch (error) {
      console.error("PayOS payment generation error:", error);
      if (error.response?.status >= 400) {
        throw new ApiError(error.response.status, `PayOS API error: ${error.response.data?.message || error.message}`);
      }
      throw new ApiError(500, `Failed to generate PayOS payment: ${error.message}`);
    }
  }

  // Verify webhook signature from PayOS
  verifyWebhookSignature(webhookData) {
    try {
      const { data, signature } = webhookData;
      if (!data || !signature) return false;

      const sortedKeys = Object.keys(data).sort();
      const sortedData = {};
      sortedKeys.forEach(key => {
        sortedData[key] = data[key];
      });

      const raw = JSON.stringify(sortedData);
      const computed = crypto
        .createHmac("sha256", this.checksumKey)
        .update(raw)
        .digest("hex");

      return computed === signature;
    } catch {
      return false;
    }
  }

  // Process PayOS webhook — lookup by orderCode
  async processWebhook(webhookData) {
    try {
      const { data } = webhookData;

      const {
        orderCode,
        status,
        transactionId,
        code: errorCode,
        desc: errorMessage,
        paidAt,
      } = data;

      console.log("Processing PayOS webhook:", { orderCode, status, errorCode });

      // Find payment transaction by orderCode
      const paymentTx = await prisma.paymentTransaction.findFirst({
        where: { orderCode: String(orderCode) },
        include: { order: true }
      });

      if (!paymentTx) {
        console.warn(`PaymentTransaction not found for orderCode: ${orderCode}`);
        return { status: "ERROR", message: "PaymentTransaction not found" };
      }

      const order = paymentTx.order;

      // Skip if already processed
      if (paymentTx.status === "completed" && status.toLowerCase() !== "refund") {
        console.log(`Order ${order.id} already completed, skipping webhook`);
        return { status: "SUCCESS", message: "Already processed" };
      }

      const paymentUpdateData = {
        errorCode: errorCode || null,
        errorMessage: errorMessage || null,
        paidAt: paidAt ? new Date(paidAt * 1000) : null,
        updatedAt: new Date()
      };

      const orderUpdateData = { updatedAt: new Date() };

      switch (status.toLowerCase()) {
        case 'paid':
        case 'success':
        case 'completed':
          paymentUpdateData.status = 'completed';
          if (transactionId) paymentUpdateData.transactionId = transactionId.toString();
          orderUpdateData.status = 'completed';
          orderUpdateData.paymentStatus = 'completed';
          orderUpdateData.paymentTimestamp = paidAt ? new Date(paidAt * 1000) : new Date();
          break;

        case 'cancelled':
          paymentUpdateData.status = 'cancelled';
          orderUpdateData.status = 'cancelled';
          orderUpdateData.paymentStatus = 'cancelled';
          break;

        case 'failed':
          paymentUpdateData.status = 'failed';
          orderUpdateData.status = 'cancelled';
          orderUpdateData.paymentStatus = 'failed';
          break;

        default:
          paymentUpdateData.status = 'pending';
          orderUpdateData.paymentStatus = 'pending';
      }

      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: paymentTx.id },
          data: paymentUpdateData
        }),
        prisma.order.update({
          where: { id: order.id },
          data: orderUpdateData
        })
      ]);

      // Xóa giỏ hàng khi thanh toán thành công
      if (status.toLowerCase() === 'paid' || status.toLowerCase() === 'success' || status.toLowerCase() === 'completed') {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: order.userId } } });
        await prisma.cart.deleteMany({ where: { userId: order.userId } });
        // Auto-assign vouchers based on rules
        const { checkAutoAssignment } = require("../vouchers/vouchers.service");
        checkAutoAssignment(order.userId, order.totalAmount).catch(err =>
          console.error("[PayOS] Auto-assign voucher failed:", err)
        );
        console.log(`Cart cleared for user ${order.userId} after successful PayOS payment`);
      }

      console.log(`PayOS webhook OK: Order ${order.id}, Status: ${status}`);
      return { status: "SUCCESS", message: "Webhook processed successfully" };

    } catch (error) {
      console.error("PayOS webhook processing error:", error);
      return { status: "ERROR", message: error.message };
    }
  }

  // Cancel payment by PayOS orderCode (used when user cancels on PayOS page)
  async cancelByOrderCode(orderCode) {
    const paymentTx = await prisma.paymentTransaction.findFirst({
      where: { orderCode: String(orderCode) }
    });

    if (!paymentTx) {
      console.warn(`PaymentTransaction not found for orderCode: ${orderCode}`);
      return false;
    }

    if (paymentTx.status === "completed") return false;

    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: paymentTx.id },
        data: { status: "cancelled", updatedAt: new Date() }
      }),
      prisma.order.update({
        where: { id: paymentTx.orderId },
        data: { status: "cancelled", paymentStatus: "cancelled", updatedAt: new Date() }
      })
    ]);

    console.log(`PayOS cancel OK: Order ${paymentTx.orderId}`);
    return true;
  }

  // Find order by PayOS orderCode (for return URL)
  async getOrderByOrderCode(orderCode) {
    const paymentTx = await prisma.paymentTransaction.findFirst({
      where: { orderCode: String(orderCode) },
      include: {
        order: {
          include: {
            orderItems: { include: { product: true } },
            user: { select: { id: true, username: true, email: true } }
          }
        }
      }
    });
    return paymentTx;
  }

  // Generate HMAC-SHA256 signature for PayOS payment-requests endpoint
  generateSignature(payload) {
    const fields = ["amount", "cancelUrl", "description", "orderCode", "returnUrl"];
    const sorted = fields
      .filter(f => payload[f] !== undefined && payload[f] !== null)
      .map(f => `${f}=${payload[f]}`)
      .join("&");

    return crypto
      .createHmac("sha256", this.checksumKey)
      .update(sorted)
      .digest("hex");
  }

  // Get payment details by order ID
  async getPaymentDetails(orderId) {
    const paymentTransaction = await prisma.paymentTransaction.findFirst({
      where: { orderId: parseInt(orderId) },
      orderBy: { createdAt: 'desc' }
    });

    if (!paymentTransaction) {
      throw new ApiError(404, `Payment details not found for order: ${orderId}`);
    }

    return paymentTransaction;
  }

  // Refund payment (local record only — PayOS API not integrated)
  async refundPayment(orderId, amount, reason) {
    const paymentTransaction = await prisma.paymentTransaction.findFirst({
      where: {
        orderId: parseInt(orderId),
        provider: "payos"
      }
    });

    if (!paymentTransaction) {
      throw new ApiError(404, `Payment not found for order: ${orderId}`);
    }

    if (paymentTransaction.status === "completed") {
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: paymentTransaction.id },
          data: {
            status: "cancelled",
            errorCode: "REFUNDED",
            errorMessage: reason || "Refund processed",
            updatedAt: new Date()
          }
        }),
        prisma.order.update({
          where: { id: parseInt(orderId) },
          data: {
            status: "cancelled",
            paymentStatus: "cancelled"
          }
        })
      ]);
    } else if (paymentTransaction.status === "pending" || paymentTransaction.status === "processing") {
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: paymentTransaction.id },
          data: {
            status: "cancelled",
            errorMessage: reason || "Payment cancelled",
            updatedAt: new Date()
          }
        }),
        prisma.order.update({
          where: { id: parseInt(orderId) },
          data: {
            status: "cancelled",
            paymentStatus: "cancelled"
          }
        })
      ]);
    }

    return paymentTransaction;
  }
}

module.exports = new PayOSService();
