const { prisma } = require("../../config/db");
const { getActivePromotions, calculateDiscount } = require("../promotions/promotions.service");
const { validateVoucher, applyVoucher, redeemVoucher, checkAutoAssignment } = require("../vouchers/vouchers.service");
const logger = require("../../utils/logger");

const createOrder = async (userId, totalAmount, paymentMethod, cartItems, voucherCode = null, voucherDiscount = 0) => {
  // BUG FIX: totalAmount from controller is already after voucher discount (controller subtracts it)
  // Do NOT subtract voucherDiscount again — that would double-discount
  const finalAmount = parseFloat(totalAmount.toFixed(2));

  logger.info("voucher.order.create", "Creating order", {
    userId,
    totalAmount,
    voucherDiscount,
    finalAmount,
    voucherCode,
  });

  const order = await prisma.order.create({
    data: {
      userId: parseInt(userId),
      totalAmount: finalAmount,
      paymentMethod,
      status: paymentMethod === 'cash' ? 'completed' : 'pending',
      paymentStatus: paymentMethod === 'cash' ? 'completed' : 'pending',
      orderItems: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
          options: item.options || undefined,
        })),
      },
    },
  });

  // Handle voucher redemption if applied
  // BUG FIX: re-validate with the ORIGINAL total (before voucher discount) for minOrderValue check
  if (voucherCode && voucherDiscount > 0) {
    const originalTotal = finalAmount + voucherDiscount;
    const validation = await validateVoucher(voucherCode, userId, originalTotal);
    if (validation.valid) {
      logger.info("voucher.redeem", "Redeeming voucher", {
        userId,
        voucherId: validation.voucher.id,
        code: voucherCode,
        orderId: order.id,
      });
      await redeemVoucher(userId, validation.voucher.id);
    } else {
      logger.warn("voucher.redeem.failed", "Voucher re-validation failed on redeem", {
        userId,
        code: voucherCode,
        error: validation.error,
        orderId: order.id,
      });
    }
  }
  return order;
};

const getCheckoutData = async (userId) => {
  const cart = await prisma.cart.findFirst({
    where: { userId: parseInt(userId) },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    return { cartItems: [], total: 0, promoDiscount: 0, freeItems: [] };
  }

  const cartItems = cart.items.map((item) => {
    const product = item.product;
    const price = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    const priceAfterDiscount = price * (1 - discount / 100);
    let options = null;
    try { options = item.options ? JSON.parse(item.options) : null; } catch (e) { options = null; }
    const toppingTotal = options?.toppings?.reduce((s, t) => s + (t.price || 0), 0) || 0;
    const unitPrice = priceAfterDiscount + toppingTotal;
    return {
      productId: product.id,
      name: product.name,
      price: parseFloat((unitPrice || 0).toFixed(2)),
      quantity: item.quantity,
      options: options ? JSON.stringify(options) : undefined,
      total: parseFloat((unitPrice * item.quantity || 0).toFixed(2)),
    };
  });

  const subtotal = parseFloat(cartItems.reduce((sum, item) => sum + item.total, 0).toFixed(2));

  // Apply promotions
  const promotions = await getActivePromotions();
  const { discountAmount: promoDiscount, freeItems } = calculateDiscount(cartItems, promotions);

  // Combine cart items with free items for display
  const allItems = [...cartItems, ...freeItems];

  // Total after promo
  const totalAfterPromo = parseFloat((subtotal - promoDiscount).toFixed(2));

  return {
    cartItems: allItems,
    subtotal,
    promoDiscount,
    total: totalAfterPromo
  };
};

const clearCart = async (userId) => {
  const cart = await prisma.cart.findFirst({
    where: { userId: parseInt(userId) },
  });
  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
};

module.exports = { getCheckoutData, clearCart, createOrder };

