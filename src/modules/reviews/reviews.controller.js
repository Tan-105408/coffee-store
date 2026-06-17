const reviewService = require("./reviews.service");
const asyncHandler = require("../../middlewares/asyncHandler");

const submitReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const review = await reviewService.createReview({
    userId: req.user.id,
    productId,
    rating,
    comment,
  });
  res.json({ message: "Review submitted", review });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getReviewsByProductId(req.params.productId);
  res.json(reviews);
});

module.exports = {
  submitReview,
  getProductReviews,
};
