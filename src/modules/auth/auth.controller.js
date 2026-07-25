const authService = require("./auth.service");
const asyncHandler = require("../../middlewares/asyncHandler");

const register = asyncHandler(async (req, res) => {
  try {
    const user = await authService.register(req.body);
    req.session.userId = user.id;
    res.redirect("/");
  } catch (err) {
    res.render("register", { error: err.message || "Đăng ký thất bại" });
  }
});

const login = asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await authService.login(username, password);
    req.session.userId = user.id;
    res.redirect("/");
  } catch (err) {
    res.render("login", { error: err.message || "Sai tên đăng nhập hoặc mật khẩu" });
  }
});

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const user = await authService.loginWithGoogle(idToken);
  req.session.userId = user.id;
  res.status(200).json({
    message: "Đăng nhập Google thành công",
    redirectUrl: "/",
  });
});

const logout = asyncHandler(async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

const getRegister = (req, res) => {
  res.render("register", { error: req.query.error || null });
};

const getProfile = asyncHandler(async (req, res) => {
  const { getUserVouchers } = require("../vouchers/vouchers.service");
  const userVouchers = await getUserVouchers(req.user.id);
  res.render("profile", { user: req.user, userVouchers });
});

const getForgotPassword = (req, res) => {
  res.render("forgot-password");
};

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  // Always return success to prevent email enumeration
  res.json({ message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi." });
});

const getLogin = (req, res) => {
  res.render("login", { error: req.query.error || null });
};

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json({ message: "Cập nhật hồ sơ thành công", user });
});

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  getLogin,
  getRegister,
  getProfile,
  getForgotPassword,
  forgotPassword,
  updateProfile,
};
