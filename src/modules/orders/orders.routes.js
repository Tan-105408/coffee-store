const express = require("express");
const orderController = require("./orders.controller");
const router = express.Router();

router.post("/confirm", orderController.confirmOrder);

module.exports = router;
