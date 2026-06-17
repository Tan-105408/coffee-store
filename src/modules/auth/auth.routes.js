const express = require("express");
const authController = require("./auth.controller");
const router = express.Router();

router.get("/login", authController.getLogin);
router.get("/register", authController.getRegister);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// OAuth and 2FA can be added here as separate branches or controllers

module.exports = router;
