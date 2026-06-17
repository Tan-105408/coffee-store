const express = require("express");
const authController = require("./auth.controller");
const auth = require("../../middlewares/auth.middleware");
const router = express.Router();

router.get("/login", authController.getLogin);
router.get("/register", authController.getRegister);
router.get("/profile", auth, authController.getProfile);
router.get("/logout", authController.logout);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/profile/update", auth, authController.updateProfile);

module.exports = router;
