const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const crypto = require("crypto");
const ApiError = require("../../utils/ApiError");

const prisma = new PrismaClient();

// Load PayOS configuration from environment
const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, PAYOS_RETURN_URL, PAYOS_CANCEL_URL, PAYOS_WEBHOOK_SECRET } = process.env;

if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
  throw new Error("PayOS environment variables are not properly configured");
}

class PayOSService {
  constructor() {
    this.client = {
      clientId: PAYOS_CLIENT_ID,
      apiKey: PAYOS_API_KEY,
      checksumKey: PAYOS_CHECKSUM_KEY,
    };
    this.baseUrl = `http://localhost:${process.env.PORT || 3030}`;
    this.returnUrl = PAYOS_RETURN_URL || `${this.baseUrl}/payment/payos/return`;
    this.cancelUrl = PAYOS_CANCEL_URL || `${this.baseUrl}/payment/payos/cancel`;
    this.webhookSecret = PAYOS_WEBHOOK_SECRET;
  }

  // Generate PayOS payment URL for an order
  async generatePaymentUrl(amount, orderId, items = []) {
    try {
      if (!orderId) {
        throw new ApiError(400, "Order ID is required for PayOS payment generation");
      }

      // Validate order exists and has pending status
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) }
      });

      if (!order) {
        throw new ApiError(404, `Order not found: ${orderId}`);
      }

      if (order.status?.toUpperCase() !== "PENDING") {
        throw new ApiError(400, `Order status is not pending. Current status: ${order.status}`);
      }

      // Prepare items for PayOS
      const payosItems = items.map(item => ({
        name: item.name || `Product ${item.productId || ''}`,
        quantity: item.quantity || 1,
        price: item.price || 0 // Vietnamese Dong (no conversion)
      }));

      const orderCode = Date.now(); // Unique order code for PayOS

      const payload = {
        orderCode,
        amount,
        description: `DH${orderId}`,
        items: payosItems,
        returnUrl: this.returnUrl,
        cancelUrl: this.cancelUrl,
        expiredAt: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes expiry
      };

      // Generate HMAC-SHA256 signature for PayOS
      payload.signature = this.generateSignature(payload);

      // Make API call to PayOS
      const response = await axios.post("https://api-merchant.payos.vn/v2/payment-requests", payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY
        }
      });

      const paymentData = response.data;

      // Validate PayOS API response status
      if (paymentData.code !== "00") {
        console.error("PayOS API returned error:", paymentData.desc, "full response:", paymentData);
        throw new ApiError(400, `PayOS API error: ${paymentData.desc || "Unknown error"}`);
      }

      if (!paymentData.data?.checkoutUrl) {
        console.error("PayOS API response missing checkoutUrl:", paymentData);
        throw new ApiError(500, "PayOS did not return a checkout URL");
      }

      // Create payment transaction record
      await prisma.paymentTransaction.create({
        data: {
          orderId: parseInt(orderId),
          provider: "PAYOS",
          status: "PENDING",
          transactionId: paymentData.data?.id?.toString(),
          amount: amount,
          currency: "VND",
          errorCode: paymentData.code?.toString(),
          errorMessage: paymentData.desc || null
        }
      });

      // Update order status to indicate payment processing
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: {
          status: "processing",
          paymentMethod: "PAYOS",
          paymentStatus: "PENDING"
        }
      });

      return {
        paymentUrl: paymentData.data?.checkoutUrl,
        orderCode: paymentData.data?.orderCode,
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
  verifyWebhookSignature(webhookData, signature) {
    const { data, signature: providedSignature } = webhookData;

    const computedSignature = this.generateWebhookChecksum({ ...data, ...{ refund: false } });

    return crypto.createHash('sha256').update(this.client.checksumKey + providedSignature).digest('hex') ===
           crypto.createHash('sha256').update(computedSignature).digest('hex');
  }

  // Process PayOS webhook
  async processWebhook(webhookData) {
    try {
      const { data } = webhookData;

      const {
        orderCode,
        amount,
        status,
        transactionId,
        description,
        cancelledAt,
        paidAt,
        refund,
        code: errorCode,
        desc: errorMessage
      } = data;

      console.log("Processing PayOS webhook:", { orderCode, status, errorCode, errorMessage });

      // Find order by PayOS orderCode
      const order = await prisma.order.findFirst({
        where: {
          paymentMethod: "PAYOS",
          AND: [
            { paymentTransaction: { transactionId: transactionId?.toString() } },
            { paymentTransaction: { status: "PENDING" } }
          ]
        }
      });

      if (!order) {
        console.warn(`Order not found for PayOS webhook: ${orderCode} (transaction: ${transactionId})`);
        return { status: "ERROR", message: "Order not found" };
      }

      // Update payment transaction
      const paymentUpdateData = {
        status: status.toUpperCase(),
        errorCode: errorCode || null,
        errorMessage: errorMessage || null,
        paidAt: paidAt ? new Date(paidAt * 1000) : null,
        updatedAt: new Date()
      };

      // Update order based on payment status
      const orderUpdateData = {};

      switch (status.toLowerCase()) {
        case 'paid':
        case 'success':
        case 'completed':
          paymentUpdateData.status = 'COMPLETED';
          orderUpdateData.status = 'completed';
          orderUpdateData.paymentStatus = 'COMPLETED';
          orderUpdateData.paymentTimestamp = paidAt ? new Date(paidAt * 1000) : new Date();
          orderUpdateData.updatedAt = new Date();
          break;

        case 'cancelled':
          paymentUpdateData.status = 'CANCELLED';
          orderUpdateData.status = 'cancelled';
          orderUpdateData.paymentStatus = 'CANCELLED';
          orderUpdateData.updatedAt = new Date();
          break;

        case 'failed':
          paymentUpdateData.status = 'FAILED';
          orderUpdateData.status = 'cancelled';
          orderUpdateData.paymentStatus = 'FAILED';
          orderUpdateData.updatedAt = new Date();
          break;

        default:
          paymentUpdateData.status = status.toUpperCase();
          orderUpdateData.paymentStatus = status.toUpperCase();
      }

      await prisma.$transaction([
        prisma.paymentTransaction.updateMany({
          where: {
            orderId: order.id,
            provider: "PAYOS"
          },
          data: paymentUpdateData
        }),
        prisma.order.update({
          where: { id: order.id },
          data: orderUpdateData
        })
      ]);

      console.log(`PayOS webhook processed successfully: Order ${order.id}, Status: ${status}`);

      return { status: "SUCCESS", message: "Webhook processed successfully" };

    } catch (error) {
      console.error("PayOS webhook processing error:", error);
      return { status: "ERROR", message: error.message };
    }
  }

  // Generate HMAC-SHA256 signature for PayOS payment-requests endpoint
  // Sorted query-string: amount=X&cancelUrl=Y&description=Z&orderCode=W&returnUrl=V
  generateSignature(payload) {
    const fields = ["amount", "cancelUrl", "description", "orderCode", "returnUrl"];
    const sorted = fields
      .filter(f => payload[f] !== undefined && payload[f] !== null)
      .map(f => `${f}=${payload[f]}`)
      .join("&");

    return crypto
      .createHmac("sha256", this.client.checksumKey)
      .update(sorted)
      .digest("hex");
  }

  // Legacy SHA256 checksum for PayOS webhook verification only
  generateWebhookChecksum(data) {
    const sortedKeys = Object.keys(data).sort();
    const sortedData = {};
    sortedKeys.forEach(key => {
      sortedData[key] = data[key];
    });

    const jsonString = JSON.stringify(sortedData);
    return crypto
      .createHash('sha256')
      .update(this.client.checksumKey + jsonString)
      .digest('hex');
  }

  // Get payment details by order ID
  async getPaymentDetails(orderId) {
    try {
      const paymentTransaction = await prisma.paymentTransaction.findFirst({
        where: { orderId: parseInt(orderId) },
        orderBy: { createdAt: 'desc' }
      });

      if (!paymentTransaction) {
        throw new ApiError(404, `Payment details not found for order: ${orderId}`);
      }

      return paymentTransaction;
    } catch (error) {
      console.error("Error getting PayOS payment details:", error);
      throw error;
    }
  }

  // Refund payment (if PayOS supports it)
  async refundPayment(orderId, amount, reason) {
    try {
      const paymentTransaction = await prisma.paymentTransaction.findFirst({
        where: {
          orderId: parseInt(orderId),
          provider: "PAYOS"
        }
      });

      if (!paymentTransaction) {
        throw new ApiError(404, `Payment not found for order: ${orderId}`);
      }

      if (paymentTransaction.status === "COMPLETED") {
        paymentTransaction.status = "REFUNDED";
        paymentTransaction.errorCode = "REFUNDED";
        paymentTransaction.errorMessage = reason || "Refund processed via webhook";
        paymentTransaction.updatedAt = new Date();

        await prisma.paymentTransaction.update({
          where: { id: paymentTransaction.id },
          data: paymentTransaction
        });

        await prisma.order.update({
          where: { id: parseInt(orderId) },
          data: {
            status: "CANCELLED",
            paymentStatus: "REFUNDED"
          }
        });
      }

      return paymentTransaction;
    } catch (error) {
      console.error("PayOS refund error:", error);
      throw error;
    }
  }
}

module.exports = new PayOSService();