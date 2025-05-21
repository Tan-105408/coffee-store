// middleware/verifyToken.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Ưu tiên lấy token từ session, sau đó mới đến header, query hay body
  const tokenCandidate =
    req.session.token || req.headers.authorization || req.query.token || req.body.token;

  if (!tokenCandidate) {
    return res.status(403).json({ message: "Không có token!" });
  }

  // Nếu token có tiền tố "Bearer ", loại bỏ nó
  const token = tokenCandidate.startsWith("Bearer ")
    ? tokenCandidate.slice(7).trim()
    : tokenCandidate;

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Lỗi verify token:", err);
      return res.status(401).json({ message: "Token không hợp lệ!" });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;
