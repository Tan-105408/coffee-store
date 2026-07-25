const reviewService = require("./reviews.service");
const asyncHandler = require("../../middlewares/asyncHandler");

const submitReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;
  const review = await reviewService.createReview({
    userId: req.user.id,
    productId,
    orderId,
    rating,
    comment,
  });
  res.json({ message: "Review submitted", review });
});

const checkReviewed = asyncHandler(async (req, res) => {
  const productIds = req.query.productIds
    ? req.query.productIds.split(",").map(Number)
    : [];
  const reviewedIds = await reviewService.getReviewedProductIds(req.user.id, req.query.orderId);
  const result = {};
  productIds.forEach((id) => {
    result[id] = reviewedIds.includes(id);
  });
  res.json(result);
});

const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getReviewsByProductId(req.params.productId);
  res.json(reviews);
});

module.exports = {
  submitReview,
  getProductReviews,
  checkReviewed,
};
