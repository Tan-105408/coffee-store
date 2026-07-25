const { prisma } = require("../../config/db");

const createReview = async (reviewData) => {
  const review = await prisma.review.create({
    data: {
      userId: parseInt(reviewData.userId),
      productId: parseInt(reviewData.productId),
      orderId: parseInt(reviewData.orderId),
      rating: parseInt(reviewData.rating),
      comment: reviewData.comment,
    },
  });

  // Trigger async bestseller recalculation (non-blocking)
  const { recalculateBestSellers } = require("../bestseller/bestseller.service");
  recalculateBestSellers().catch((err) => console.error("[BestSeller] Recalc failed:", err));

  return review;
};

const getReviewsByProductId = async (productId) => {
  return await prisma.review.findMany({
    where: { productId: parseInt(productId) },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });
};

const getReviewedProductIds = async (userId, orderId) => {
  const reviews = await prisma.review.findMany({
    where: { userId: parseInt(userId), orderId: orderId ? parseInt(orderId) : undefined },
    select: { productId: true },
  });
  return reviews.map((r) => r.productId);
};

module.exports = {
  createReview,
  getReviewsByProductId,
  getReviewedProductIds,
};
