const authService = require("./auth.service");
const { setTokenCookies, clearTokenCookies } = require("../../utils/cookie");
const asyncHandler = require("../../middlewares/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  const { accessToken, refreshToken } = await authService.generateAuthTokens(user);
  setTokenCookies(res, accessToken, refreshToken);
  res.redirect("/");
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await authService.login(username, password);
  const { accessToken, refreshToken } = await authService.generateAuthTokens(user);
  setTokenCookies(res, accessToken, refreshToken);
  res.redirect("/");
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const tokens = await authService.refreshAuth(refreshToken);
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
  res.json({ message: "Token refreshed" });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  await authService.logout(refreshToken);
  clearTokenCookies(res);
  res.redirect("/");
});

const getLogin = (req, res) => {
  res.render("login");
};

const getRegister = (req, res) => {
  res.render("register");
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getLogin,
  getRegister,
};
