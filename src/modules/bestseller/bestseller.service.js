const { prisma } = require("../../config/db");

const DEFAULTS = {
  bestseller_min_rating: "4.0",
  bestseller_min_reviews: "5",
};

const getSettings = async () => {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: Object.keys(DEFAULTS) } },
    });
    const map = {};
    rows.forEach((r) => (map[r.key] = r.value));
    return {
      minRating: parseFloat(map.bestseller_min_rating || DEFAULTS.bestseller_min_rating),
      minReviews: parseInt(map.bestseller_min_reviews || DEFAULTS.bestseller_min_reviews),
    };
  } catch (error) {
    console.error("[BestSeller] getSettings error:", error);
    return {
      minRating: parseFloat(DEFAULTS.bestseller_min_rating),
      minReviews: parseInt(DEFAULTS.bestseller_min_reviews),
    };
  }
};

const updateSettings = async ({ minRating, minReviews }) => {
  const upserts = [];
  if (minRating !== undefined) {
    upserts.push(
      prisma.siteSetting.upsert({
        where: { key: "bestseller_min_rating" },
        update: { value: String(minRating) },
        create: { key: "bestseller_min_rating", value: String(minRating) },
      })
    );
  }
  if (minReviews !== undefined) {
    upserts.push(
      prisma.siteSetting.upsert({
        where: { key: "bestseller_min_reviews" },
        update: { value: String(minReviews) },
        create: { key: "bestseller_min_reviews", value: String(minReviews) },
      })
    );
  }
  await Promise.all(upserts);
};

/**
 * Recalculate auto best-seller status for ALL products.
 * bestSellerOverride: true = force on, false = force off, null = auto.
 */
const recalculateBestSellers = async () => {
  const { minRating, minReviews } = await getSettings();

  // Get review stats for all products
  const stats = await prisma.review.groupBy({
    by: ["productId"],
    _avg: { rating: true },
    _count: { rating: true },
  });

  const statsMap = {};
  stats.forEach((s) => {
    statsMap[s.productId] = {
      avg: Math.round((s._avg.rating || 0) * 10) / 10,
      count: s._count.rating,
    };
  });

  const products = await prisma.product.findMany({ select: { id: true, bestSellerOverride: true } });

  const updates = [];
  for (const p of products) {
    // Forced override takes priority
    if (p.bestSellerOverride === true) {
      updates.push(
        prisma.product.update({
          where: { id: p.id },
          data: { isBestSeller: true, bestSellerReason: "Đượcadmin chọn" },
        })
      );
      continue;
    }
    if (p.bestSellerOverride === false) {
      updates.push(
        prisma.product.update({
          where: { id: p.id },
          data: { isBestSeller: false, bestSellerReason: null },
        })
      );
      continue;
    }

    // Auto mode (override === null)
    const s = statsMap[p.id] || { avg: 0, count: 0 };
    const qualifies = s.avg >= minRating && s.count >= minReviews;
    updates.push(
      prisma.product.update({
        where: { id: p.id },
        data: {
          isBestSeller: qualifies,
          bestSellerReason: qualifies
            ? `Tự động: ${s.avg}★ (${s.count} đánh giá)`
            : null,
        },
      })
    );
  }

  await Promise.all(updates);
  return { minRating, minReviews, processed: updates.length };
};

module.exports = { getSettings, updateSettings, recalculateBestSellers };
