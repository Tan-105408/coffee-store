const express = require("express");
const authController = require("./auth.controller");
const auth = require("../../middlewares/auth.middleware");
const router = express.Router();

// GET /auth → redirect home
router.get("/", (req, res) => res.redirect("/"));

router.get("/login", authController.getLogin);
router.get("/register", authController.getRegister);
router.get("/forgot-password", authController.getForgotPassword);
router.get("/profile", auth, authController.getProfile);
router.get("/logout", authController.logout);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/profile/update", auth, authController.updateProfile);

module.exports = router;
