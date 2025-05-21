const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const passport = require("passport");
const speakeasy = require("speakeasy");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

// Thêm route GET cho trang đăng nhập
router.get("/login", (req, res) => {
  res.render("login"); // đảm bảo file login.ejs tồn tại trong folder views
});

// Thêm route GET cho trang đăng ký
router.get("/register", (req, res) => {
  res.render("register"); // đảm bảo file register.ejs tồn tại trong folder views
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng!" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    req.session.token = token;
    res.redirect('/');
  }
  catch (error) {
    res.status(500).json({ message: "Lỗi đăng ký", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Sai thông tin đăng nhập!" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    req.session.token = token;
    res.redirect('/');
  } catch (error) {
    res.status(500).json({ message: "Lỗi đăng nhập", error: error.message });
  }
});

router.get("/logout", (req, res) => {
  // Hủy session của người dùng
  req.session.destroy((err) => {
    if (err) {
      console.error("Lỗi khi đăng xuất:", err);
      return res.status(500).json({ message: "Lỗi đăng xuất" });
    }
    // Sau khi hủy session, chuyển về trang chủ hoặc trang login
    res.redirect("/");
  });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email không tồn tại!" });
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    await user.save();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    const resetLink = `http://localhost:3000/reset-password/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Đặt lại mật khẩu",
      text: `Nhấp vào liên kết sau để đặt lại mật khẩu: ${resetLink}`,
    });
    res.json({ message: "Email đặt lại mật khẩu đã được gửi!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi gửi email", error: error.message });
  }
});

router.post("/setup-2fa", verifyToken, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ length: 20 });
    const user = await User.findById(req.userId);
    user.twoFactorSecret = secret.base32;
    await user.save();
    res.json({ message: "2FA đã được thiết lập!", secret: secret.otpauth_url });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thiết lập 2FA", error: error.message });
  }
});

router.post("/verify-2fa", verifyToken, async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findById(req.userId);
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });
    if (verified) res.json({ message: "Xác thực 2FA thành công!" });
    else res.status(400).json({ message: "Mã 2FA không hợp lệ!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xác thực 2FA", error: error.message });
  }
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/login" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.redirect(`/?token=${token}`);
  }
);

router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/auth/login" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.redirect(`/?token=${token}`);
  }
);

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại!" });
    res.render("profile", { user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy hồ sơ", error: error.message });
  }
});

router.post("/profile/update", verifyToken, async (req, res) => {
  console.log("Request body:", req.body); // Kiểm tra dump dữ liệu gửi lên
  const { username, email, address } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại!" });
    if (username) user.username = username;
    if (email) user.email = email;
    if (address) user.address = address;
    await user.save();
    res.json({ message: "Cập nhật hồ sơ thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật hồ sơ", error: error.message });
  }
});

module.exports = router;
