const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const restrictTo = require("../../middlewares/role.middleware");
const { getSettings, updateSettings, toggleOverride } = require("./bestseller.controller");

router.get("/settings", auth, restrictTo("admin"), getSettings);
router.post("/settings", auth, restrictTo("admin"), updateSettings);
router.post("/toggle/:id", auth, restrictTo("admin"), toggleOverride);

module.exports = router;
