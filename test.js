try {
  const session = require("express-session");
  console.log("express-session loaded successfully:", session);
} catch (err) {
  console.error("Error loading express-session:", err);
}