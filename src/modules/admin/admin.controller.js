const { prisma } = require("../../config/db");
const asyncHandler = require("../../middlewares/asyncHandler");

const getDashboard = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany();
  const orders = await prisma.order.findMany({ include: { user: true, orderItems: { include: { product: true } } } });

  // ── Basic counts ──
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const yesterdayOrders = orders.filter(o => { const d = new Date(o.createdAt); return d >= yesterday && d < today; });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  // ── Trend percentages (today vs yesterday) ──
  const pct = (cur, prev) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
  const revenueTrend = pct(todayRevenue, yesterdayRevenue);
  const ordersTrend = pct(todayOrders.length, yesterdayOrders.length);

  // ── Monthly data for chart (12 months) ──
  const monthlyData = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const mOrders = orders.filter(o => { const od = new Date(o.createdAt); return od >= d && od < dEnd; });
    const mRevenue = mOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    monthlyData.push({
      label: d.toLocaleString('vi-VN', { month: 'short', year: '2-digit' }),
      orders: mOrders.length,
      revenue: mRevenue
    });
  }
  // Trend per month vs previous
  for (let i = 0; i < monthlyData.length; i++) {
    const prev = i > 0 ? monthlyData[i - 1].orders : 0;
    monthlyData[i].trend = prev === 0 ? (monthlyData[i].orders > 0 ? 100 : 0) : Math.round(((monthlyData[i].orders - prev) / prev) * 100);
  }

  // ── Promotions, Vouchers, VoucherRules ──
  const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  const vouchers = await prisma.voucher.findMany({ orderBy: { createdAt: "desc" } });
  const voucherRules = await prisma.voucherRule.findMany({ include: { voucher: true }, orderBy: { id: "desc" } });

  res.render("admin-dashboard", {
    users, products, orders, user: req.user,
    promotions, vouchers, voucherRules,
    stats: {
      todayOrders: todayOrders.length, todayRevenue, yesterdayOrders: yesterdayOrders.length,
      pendingCount, processingCount, completedCount, cancelledCount,
      revenueTrend, ordersTrend,
      monthlyData: JSON.stringify(monthlyData)
    }
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  // Delete related records first (no cascade FK)
  await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
  await prisma.cart.deleteMany({ where: { userId } });
  await prisma.orderItem.deleteMany({ where: { order: { userId } } });
  await prisma.paymentTransaction.deleteMany({ where: { order: { userId } } });
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.review.deleteMany({ where: { userId } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  res.redirect("/admin");
});

const addProduct = asyncHandler(async (req, res) => {
  const { name, price, image, category, description, discount, isBestSeller, promoTag } = req.body;
  await prisma.product.create({
    data: {
      name,
      price: parseFloat(price),
      image,
      category,
      description,
      discount: discount ? parseInt(discount) : 0,
      isBestSeller: isBestSeller === "true",
      promoTag: promoTag || null,
    },
  });
  res.redirect("/admin");
});

const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, image, description, category, discount, isBestSeller, promoTag } = req.body;
  await prisma.product.update({
    where: { id: parseInt(req.params.id) },
    data: {
      name,
      price: parseFloat(price),
      image,
      description,
      category,
      discount: discount ? parseInt(discount) : 0,
      isBestSeller: isBestSeller === "true",
      promoTag: promoTag || null,
    },
  });
  res.redirect("/admin");
});

const deleteProduct = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return res.redirect("/admin");

  // Check if product has existing orders (OrderItem onDelete: Restrict)
  const hasOrders = await prisma.orderItem.findFirst({
    where: { productId: id },
    select: { id: true },
  });

  if (hasOrders) {
    // Disable instead of delete — Prisma FK restricts deletion
    await prisma.product.update({
      where: { id },
      data: { name: `${product.name} [Đã ngưng bán]`, isBestSeller: false },
    });
  } else {
    await prisma.product.delete({ where: { id } });
  }

  res.redirect("/admin");
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  await prisma.order.update({
    where: { id: parseInt(req.params.id) },
    data: { status },
  });
  // AJAX → JSON, form submit → redirect
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.json({ success: true });
  }
  res.redirect("/admin");
});

const updateOrderNote = asyncHandler(async (req, res) => {
  const { orderId, note, estimatedReadyTime } = req.body;
  await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      note: note || null,
      estimatedReadyTime: estimatedReadyTime ? new Date(estimatedReadyTime) : null,
    },
  });
  // AJAX → JSON, form submit → redirect
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.json({ success: true });
  }
  res.redirect("/admin");
});

const deleteOrder = asyncHandler(async (req, res) => {
  // First delete related items
  await prisma.orderItem.deleteMany({ where: { orderId: parseInt(req.params.id) } });
  // Then delete the order
  await prisma.order.delete({ where: { id: parseInt(req.params.id) } });
  res.redirect("/admin");
});

// ── Admin view user vouchers ──
const getUserVouchers = asyncHandler(async (req, res) => {
  const userVouchers = await prisma.userVoucher.findMany({
    include: { user: { select: { id: true, username: true, email: true } }, voucher: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(userVouchers);
});

// ── Admin assign voucher to user ──
const assignVoucherToUser = asyncHandler(async (req, res) => {
  const { userId, voucherId } = req.body;
  const { assignVoucher } = require("../vouchers/vouchers.service");
  await assignVoucher(parseInt(userId), parseInt(voucherId));
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({ success: true });
  }
  res.redirect("/admin#user-vouchers");
});

module.exports = { getDashboard, deleteUser, addProduct, updateProduct, deleteProduct, updateOrderStatus, updateOrderNote, deleteOrder, getUserVouchers, assignVoucherToUser };
