const express = require("express");
const orderController = require("./orders.controller");
const auth = require("../../middlewares/auth.middleware");
const router = express.Router();

router.post("/confirm", orderController.confirmOrder);
router.get("/history", auth, orderController.getOrderHistory);

module.exports = router;
