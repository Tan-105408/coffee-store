const express = require("express");
const reviewController = require("./reviews.controller");
const auth = require("../../middlewares/auth.middleware");
const router = express.Router();

router.post("/submit", auth, reviewController.submitReview);
router.get("/check-reviewed", auth, reviewController.checkReviewed);
router.get("/:productId", reviewController.getProductReviews);

module.exports = router;
