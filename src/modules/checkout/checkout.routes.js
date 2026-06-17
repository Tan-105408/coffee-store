const express = require("express");
const checkoutController = require("./checkout.controller");
const auth = require("../../middlewares/auth.middleware");
const router = express.Router();

router.use(auth);

router.get("/", checkoutController.getCheckout);
router.post("/", checkoutController.processCheckout);

module.exports = router;
