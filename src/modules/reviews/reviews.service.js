const { prisma } = require("../../config/db");

const createReview = async (reviewData) => {
  return await prisma.review.create({
    data: {
      userId: parseInt(reviewData.userId),
      productId: parseInt(reviewData.productId),
      rating: parseInt(reviewData.rating),
      comment: reviewData.comment,
    },
  });
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

const getReviewedProductIds = async (userId) => {
  const reviews = await prisma.review.findMany({
    where: { userId: parseInt(userId) },
    select: { productId: true },
  });
  return reviews.map((r) => r.productId);
};

module.exports = {
  createReview,
  getReviewsByProductId,
  getReviewedProductIds,
};
