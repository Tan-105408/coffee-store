const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const RefreshToken = require("../../models/RefreshToken");
const { generateToken } = require("../../utils/jwt");
const ApiError = require("../../utils/ApiError");

const register = async (userData) => {
  const { username, email, password } = userData;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "Email already in use");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashedPassword });
  return user;
};

const login = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Invalid username or password");
  }
  return user;
};

const generateAuthTokens = async (user) => {
  const accessToken = generateToken(
    { id: user._id },
    process.env.JWT_SECRET,
    "15m"
  );
  const refreshToken = generateToken(
    { id: user._id },
    process.env.JWT_SECRET,
    "7d"
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

const refreshAuth = async (refreshToken) => {
  const refreshTokenDoc = await RefreshToken.findOne({ token: refreshToken });
  if (!refreshTokenDoc || refreshTokenDoc.expiresAt < new Date()) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(refreshTokenDoc.userId);
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // Rotate refresh token
  await RefreshToken.deleteOne({ _id: refreshTokenDoc._id });
  return generateAuthTokens(user);
};

const logout = async (refreshToken) => {
  await RefreshToken.deleteOne({ token: refreshToken });
};

module.exports = {
  register,
  login,
  generateAuthTokens,
  refreshAuth,
  logout,
};
