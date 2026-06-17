const Review = require("../../models/Review");

const createReview = async (reviewData) => {
  return await Review.create(reviewData);
};

const getReviewsByProductId = async (productId) => {
  return await Review.find({ productId }).populate("userId", "username");
};

module.exports = {
  createReview,
  getReviewsByProductId,
};
