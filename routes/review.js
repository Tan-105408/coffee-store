const express = require("express");
const Review = require("../models/Review");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.post("/submit", verifyToken, async (req, res) => {
  const { productId, rating, comment } = req.body;
  try {
    const review = new Review({
      userId: req.userId,
      productId,
      rating,
      comment,
    });
    await review.save();
    res.json({ message: "Đánh giá đã được gửi", review });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gửi đánh giá", error: error.message });
  }
});

router.get("/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const reviews = await Review.find({ productId }).populate("userId", "username");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy đánh giá", error: error.message });
  }
});

module.exports = router;