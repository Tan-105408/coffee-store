const { prisma } = require("../../config/db");

const getActivePromotions = async () => {
  const now = new Date();
  return await prisma.promotion.findMany({
    where: {
      isActive: true,
      OR: [
        { startDate: null, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: null },
        { startDate: { lte: now }, endDate: { gte: now } },
      ],
    },
  });
};

/**
 * Calculate promotion discount for cart items.
 * Returns: { discountAmount, freeItems } where freeItems are inserted into order.
 */
const calculateDiscount = (cartItems, promotions) => {
  let discountAmount = 0;
  const freeItems = [];

  for (const promo of promotions) {
    if (promo.type === "buyXGetY") {
      // Group cart items by product, check quantity
      const qtyMap = {};
      cartItems.forEach((item) => {
        qtyMap[item.productId] = (qtyMap[item.productId] || 0) + item.quantity;
      });

      for (const [productId, qty] of Object.entries(qtyMap)) {
        const buyQ = promo.buyQuantity || 3;
        const getQ = promo.getQuantity || 1;
        const times = Math.floor(qty / buyQ);
        if (times > 0) {
          const item = cartItems.find((i) => i.productId === Number(productId));
          if (item) {
            // Add free items (priced at 0)
            for (let i = 0; i < times * getQ; i++) {
              freeItems.push({
                productId: item.productId,
                name: `${item.name} (KM)`,
                price: 0,
                quantity: 1,
                total: 0,
                priceAtPurchase: 0,
              });
            }
          }
        }
      }
    } else if (promo.type === "percentOff") {
      const minQ = promo.minQuantity || 1;
      const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
      if (totalQty >= minQ) {
        const pct = (promo.discount || 0) / 100;
        discountAmount += cartItems.reduce((s, i) => s + i.total * pct, 0);
      }
    } else if (promo.type === "freeItem") {
      const minQ = promo.minQuantity || 1;
      const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);
      if (totalQty >= minQ && promo.freeProductId) {
        const alreadyFree = freeItems.some((f) => f.productId === promo.freeProductId);
        if (!alreadyFree) {
          freeItems.push({
            productId: promo.freeProductId,
            name: `Quà tặng`,
            price: 0,
            quantity: 1,
            total: 0,
            priceAtPurchase: 0,
          });
        }
      }
    }
  }

  return { discountAmount: parseFloat(discountAmount.toFixed(2)), freeItems };
};

const getAll = async () => {
  return await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
};

const create = async (data) => {
  const payload = {
    name: data.name,
    type: data.type,
    isActive: data.isActive === "true" || data.isActive === true,
  };
  if (data.type === "buyXGetY") {
    payload.buyQuantity = parseInt(data.buyQuantity) || 3;
    payload.getQuantity = parseInt(data.getQuantity) || 1;
  }
  if (data.type === "percentOff") {
    payload.minQuantity = data.minQuantity ? parseInt(data.minQuantity) : null;
    payload.discount = data.discount ? parseFloat(data.discount) : null;
  }
  if (data.type === "freeItem") {
    payload.minQuantity = data.minQuantity ? parseInt(data.minQuantity) : null;
    payload.freeProductId = data.freeProductId ? parseInt(data.freeProductId) : null;
  }
  if (data.startDate) payload.startDate = new Date(data.startDate);
  if (data.endDate) payload.endDate = new Date(data.endDate);
  return await prisma.promotion.create({ data: payload });
};

const remove = async (id) => {
  return await prisma.promotion.delete({ where: { id: parseInt(id) } });
};

module.exports = { getActivePromotions, calculateDiscount, getAll, create, remove };
