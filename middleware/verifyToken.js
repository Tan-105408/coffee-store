const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.body.token || req.query.token;
  if (!authHeader) {
    return res.status(403).json({ message: "Không có token!" });
  }
  
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token không hợp lệ!" });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;