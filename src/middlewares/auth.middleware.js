const ApiError = require("../utils/ApiError");
const { prisma } = require("../config/db");
const asyncHandler = require("./asyncHandler");

const auth = asyncHandler(async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    throw new ApiError(401, "Vui lòng đăng nhập");
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.session.userId) },
  });

  if (!user) {
    req.session.destroy();
    throw new ApiError(401, "Người dùng không tồn tại");
  }

  req.user = user;
  res.locals.user = user;
  next();
});

module.exports = auth;
