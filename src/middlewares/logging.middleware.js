const fs = require("fs");

const loggingMiddleware = (req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  fs.appendFile("server.log", log, (err) => {
    if (err) console.error("Lỗi ghi log:", err);
  });
  next();
};

module.exports = loggingMiddleware;
