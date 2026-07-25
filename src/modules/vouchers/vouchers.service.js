const { prisma } = require("../../config/db");
const logger = require("../../utils/logger");

const validateVoucher = async (code, userId, orderTotal) => {
  // Normalize to uppercase (codes are stored uppercased in create())
  const normalizedCode = code.toUpperCase();
  logger.info("voucher.validate", "Validating voucher", { code: normalizedCode, originalCode: code, userId, orderTotal });

  const voucher = await prisma.voucher.findUnique({ where: { code: normalizedCode } });
  if (!voucher) {
    logger.warn("voucher.validate.not_found", "Voucher code not found", { code });
    return { valid: false, error: "Mã voucher không tồn tại" };
  }
  if (!voucher.isActive) {
    logger.warn("voucher.validate.inactive", "Voucher is inactive", { code, id: voucher.id });
    return { valid: false, error: "Mã voucher đã bị khóa" };
  }
  if (voucher.expiresAt && new Date() > voucher.expiresAt) {
    logger.warn("voucher.validate.expired", "Voucher expired", { code, expiresAt: voucher.expiresAt });
    return { valid: false, error: "Mã voucher đã hết hạn" };
  }
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    logger.warn("voucher.validate.used_up", "Voucher usage limit reached", { code, usedCount: voucher.usedCount, usageLimit: voucher.usageLimit });
    return { valid: false, error: "Mã voucher đã hết lượt sử dụng" };
  }
  if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
    logger.warn("voucher.validate.min_order", "Order below minimum", { code, orderTotal, minOrderValue: voucher.minOrderValue });
    return { valid: false, error: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}đ` };
  }
  // Check if user already used this voucher
  if (userId) {
    const existing = await prisma.userVoucher.findFirst({
      where: { userId: parseInt(userId), voucherId: voucher.id, isUsed: true },
    });
    if (existing) {
      logger.warn("voucher.validate.already_used", "User already used this voucher", { userId, voucherId: voucher.id, code });
      return { valid: false, error: "Bạn đã sử dụng mã này rồi" };
    }
  }
  logger.info("voucher.validate.valid", "Voucher is valid", { code, voucherId: voucher.id });
  return { valid: true, voucher };
};

const applyVoucher = (voucher, orderTotal) => {
  let discount = 0;
  if (voucher.discountType === "percent") {
    discount = orderTotal * (voucher.discountValue / 100);
    if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
  } else {
    discount = voucher.discountValue;
  }
  discount = Math.min(discount, orderTotal);
  return parseFloat(discount.toFixed(2));
};

const redeemVoucher = async (userId, voucherId) => {
  logger.info("voucher.redeem", "Redeeming voucher", { userId, voucherId });
  // Mark user's voucher as used
  const result = await prisma.userVoucher.updateMany({
    where: { userId: parseInt(userId), voucherId: parseInt(voucherId), isUsed: false },
    data: { isUsed: true, usedAt: new Date() },
  });
  // Increment usedCount on voucher
  await prisma.voucher.update({
    where: { id: parseInt(voucherId) },
    data: { usedCount: { increment: 1 } },
  });
  logger.info("voucher.redeem.done", "Voucher redeemed", { userId, voucherId, updatedCount: result.count });
};

const assignVoucher = async (userId, voucherId) => {
  await prisma.userVoucher.upsert({
    where: { userId_voucherId: { userId: parseInt(userId), voucherId: parseInt(voucherId) } },
    update: {},
    create: { userId: parseInt(userId), voucherId: parseInt(voucherId) },
  });
};

const getUserVouchers = async (userId) => {
  return await prisma.userVoucher.findMany({
    where: { userId: parseInt(userId), isUsed: false },
    include: { voucher: true },
    orderBy: { createdAt: "desc" },
  });
};

// Auto-assign vouchers based on VoucherRules after order completion
const checkAutoAssignment = async (userId, orderTotal) => {
  const rules = await prisma.voucherRule.findMany({ where: { isActive: true } });
  for (const rule of rules) {
    let qualifies = false;
    if (rule.triggerType === "totalSpend") {
      const totalSpend = await prisma.order.aggregate({
        where: { userId: parseInt(userId), status: { notIn: ["cancelled"] } },
        _sum: { totalAmount: true },
      });
      qualifies = (totalSpend._sum.totalAmount || 0) >= rule.threshold;
    } else if (rule.triggerType === "orderCount") {
      const orderCount = await prisma.order.count({
        where: { userId: parseInt(userId), status: "completed" },
      });
      qualifies = orderCount >= rule.threshold;
    }
    // Check if user already got this voucher (don't assign twice)
    if (qualifies) {
      const existing = await prisma.userVoucher.findFirst({
        where: { userId: parseInt(userId), voucherId: rule.voucherId },
      });
      if (existing) qualifies = false;
    }
    if (qualifies) {
      await assignVoucher(userId, rule.voucherId);
    }
  }
};

// Admin CRUD
const getAll = async () => {
  return await prisma.voucher.findMany({ orderBy: { createdAt: "desc" } });
};

const create = async (data) => {
  return await prisma.voucher.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description || null,
      discountType: data.discountType,
      discountValue: parseFloat(data.discountValue),
      minOrderValue: data.minOrderValue ? parseFloat(data.minOrderValue) : null,
      maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
      isActive: data.isActive === "true" || data.isActive === true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
};

const remove = async (id) => {
  // Delete related user vouchers first
  await prisma.userVoucher.deleteMany({ where: { voucherId: parseInt(id) } });
  await prisma.voucherRule.deleteMany({ where: { voucherId: parseInt(id) } });
  return await prisma.voucher.delete({ where: { id: parseInt(id) } });
};

module.exports = { validateVoucher, applyVoucher, redeemVoucher, assignVoucher, getUserVouchers, checkAutoAssignment, getAll, create, remove };
