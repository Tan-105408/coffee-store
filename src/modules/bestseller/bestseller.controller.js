const asyncHandler = require("../../middlewares/asyncHandler");
const bestsellerService = require("./bestseller.service");

const getSettings = asyncHandler(async (req, res) => {
  const settings = await bestsellerService.getSettings();
  const { prisma } = require("../../config/db");
  const products = await prisma.product.findMany({
    select: { id: true, name: true, isBestSeller: true, bestSellerOverride: true, bestSellerReason: true },
    orderBy: { name: "asc" },
  });
  res.json({ settings, products });
});

const updateSettings = asyncHandler(async (req, res) => {
  const { minRating, minReviews } = req.body;
  await bestsellerService.updateSettings({
    minRating: minRating ? parseFloat(minRating) : undefined,
    minReviews: minReviews ? parseInt(minReviews) : undefined,
  });
  // Recalculate after settings change
  await bestsellerService.recalculateBestSellers();
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({ success: true });
  }
  res.redirect("/admin");
});

const toggleOverride = asyncHandler(async (req, res) => {
  const { prisma } = require("../../config/db");
  const id = parseInt(req.params.id);
  const { override } = req.body; // "true", "false", or "auto"

  let bestSellerOverride = null;
  if (override === "true") bestSellerOverride = true;
  else if (override === "false") bestSellerOverride = false;

  await prisma.product.update({
    where: { id },
    data: {
      bestSellerOverride,
      isBestSeller: bestSellerOverride === true,
      bestSellerReason: bestSellerOverride === true ? "Được admin chọn" : null,
    },
  });

  // If set to auto, recalculate
  if (bestSellerOverride === null) {
    await bestsellerService.recalculateBestSellers();
  }

  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({ success: true });
  }
  res.redirect("/admin");
});

module.exports = { getSettings, updateSettings, toggleOverride };
