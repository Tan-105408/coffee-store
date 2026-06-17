const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const { prisma } = require("../config/db");
const asyncHandler = require("./asyncHandler");

const auth = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, "Please authenticate");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.id) },
    });

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;
    res.locals.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid token");
  }
});

module.exports = auth;
