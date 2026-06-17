const bcrypt = require("bcryptjs");
const { prisma } = require("../../config/db");
const { generateToken } = require("../../utils/jwt");
const ApiError = require("../../utils/ApiError");

const register = async (userData) => {
  const { username, email, password } = userData;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, "Email already in use");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
  });
  return user;
};

const login = async (username, password) => {
  const user = await prisma.user.findFirst({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Invalid username or password");
  }
  return user;
};

const generateAuthTokens = async (user) => {
  const accessToken = generateToken(
    { id: user.id },
    process.env.JWT_SECRET,
    "15m"
  );
  const refreshToken = generateToken(
    { id: user.id },
    process.env.JWT_SECRET,
    "7d"
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
};

const refreshAuth = async (refreshToken) => {
  const refreshTokenDoc = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (!refreshTokenDoc || refreshTokenDoc.expiresAt < new Date()) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: refreshTokenDoc.userId },
  });
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: refreshTokenDoc.id } });
  return generateAuthTokens(user);
};

const logout = async (refreshToken) => {
  await prisma.refreshToken.delete({ where: { token: refreshToken } }).catch(() => {});
};

const updateProfile = async (userId, updateData) => {
  return await prisma.user.update({
    where: { id: parseInt(userId) },
    data: updateData,
  });
};

module.exports = {
  register,
  login,
  generateAuthTokens,
  refreshAuth,
  logout,
  updateProfile,
};
