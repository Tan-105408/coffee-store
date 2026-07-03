const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth.middleware");
const restrictTo = require("../../middlewares/role.middleware");
const adminController = require("./admin.controller");

// Dashboard route - Admin only
router.get("/", auth, restrictTo("admin"), adminController.getDashboard);

// User Management
router.post("/users/delete/:id", auth, restrictTo("admin"), adminController.deleteUser);

// Product Management
router.post("/products/add", auth, restrictTo("admin"), adminController.addProduct);
router.post("/products/update/:id", auth, restrictTo("admin"), adminController.updateProduct);
router.post("/products/delete/:id", auth, restrictTo("admin"), adminController.deleteProduct);

// Order Management
router.post("/orders/update-status/:id", auth, restrictTo("admin"), adminController.updateOrderStatus);
router.post("/orders/delete/:id", auth, restrictTo("admin"), adminController.deleteOrder);

module.exports = router;
