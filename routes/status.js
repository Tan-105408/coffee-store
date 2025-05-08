const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ status: "Server hoạt động tốt!" });
});

module.exports = router;