const express = require("express");
const cartController = require("./carts.controller");
const auth = require("../../middlewares/auth.middleware");
const router = express.Router();

router.use(auth);

router.get("/", cartController.getCart);
router.post("/add", cartController.addItemToCart);
router.delete("/remove/:productId", cartController.removeItemFromCart);

module.exports = router;
