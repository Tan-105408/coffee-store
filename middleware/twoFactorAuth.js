const twoFactorAuth = (req, res, next) => {
  if (req.user && req.user.twoFactorValidated) {
    return next();
  }
  return res.status(403).json({ message: "Yêu cầu xác thực 2 bước trước khi truy cập!" });
};

module.exports = twoFactorAuth;