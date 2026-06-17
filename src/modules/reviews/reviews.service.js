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

module.exports = {
  createReview,
  getReviewsByProductId,
};
