const express = require("express");
const productController = require("./products.controller");
const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductDetail);
router.post("/add", productController.addProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
