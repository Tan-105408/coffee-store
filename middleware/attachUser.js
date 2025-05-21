// middleware/attachUser.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  if (req.session.token) {
    try {
      const decoded = jwt.verify(req.session.token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).lean();
      res.locals.user = req.user; // Giờ mọi view đều có biến user
    } catch (err) {
      console.error("Không thể giải mã token:", err.message);
      req.user = null;
      res.locals.user = null;
    }
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
};
