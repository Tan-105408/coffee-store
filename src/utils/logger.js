const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");
const ERROR_FILE = path.join(LOG_DIR, "errors.log");
const CLIENT_FILE = path.join(LOG_DIR, "client.log");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function formatEntry(level, type, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    type,
    message,
    ...meta,
  }) + "\n";
}

function append(filePath, text) {
  fs.appendFile(filePath, text, (err) => {
    if (err) console.error("Logger write failed:", err);
  });
}

// ─── Backend loggers ──────────────────────────────────────────────

function info(type, message, meta) {
  append(LOG_FILE, formatEntry("info", type, message, meta));
}

function warn(type, message, meta) {
  append(LOG_FILE, formatEntry("warn", type, message, meta));
  append(ERROR_FILE, formatEntry("warn", type, message, meta));
}

function error(type, message, meta) {
  append(LOG_FILE, formatEntry("error", type, message, meta));
  append(ERROR_FILE, formatEntry("error", type, message, meta));
}

/** Express error handler middleware — logs error then delegates */
function errorMiddleware(err, req, res, next) {
  let { statusCode, message } = err;
  if (!statusCode) statusCode = 500;

  error("backend", message, {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || null,
    stack: err.stack,
  });

  // Delegate to existing errorHandler
  const existingHandler = require("../middlewares/error.middleware");
  existingHandler(err, req, res, next);
}

/** Request logger middleware — logs every HTTP request */
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "warn" : "info";
    append(LOG_FILE, formatEntry(level, "http", `${req.method} ${req.originalUrl} ${res.statusCode}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id || null,
    }));
  });
  next();
}

// ─── Client log receiver (POST /admin/api/client-log) ─────────────

function clientLog(req, res) {
  const { level, message, meta } = req.body;
  append(LOG_FILE, formatEntry(level || "info", "client", message, meta || {}));
  if (level === "error" || level === "warn") {
    append(ERROR_FILE, formatEntry(level, "client", message, meta || {}));
  }
  append(CLIENT_FILE, formatEntry(level || "info", "client", message, meta || {}));
  res.json({ ok: true });
}

module.exports = {
  info,
  warn,
  error,
  errorMiddleware,
  requestLogger,
  clientLog,
  LOG_FILE,
  ERROR_FILE,
  CLIENT_FILE,
};