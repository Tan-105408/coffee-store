const { prisma } = require("../config/db");
const asyncHandler = require("./asyncHandler");

const optionalAuth = asyncHandler(async (req, res, next) => {
  if (req.session && req.session.userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.session.userId) },
    });
    if (user) {
      req.user = user;
      res.locals.user = user;
    }
  }
  next();
});

module.exports = optionalAuth;
