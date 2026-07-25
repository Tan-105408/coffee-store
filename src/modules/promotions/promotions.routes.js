const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const restrictTo = require("../../middlewares/role.middleware");
const { getAll, createPromo, deletePromo } = require("./promotions.controller");

router.get("/", auth, restrictTo("admin"), getAll);
router.post("/", auth, restrictTo("admin"), createPromo);
router.post("/:id/delete", auth, restrictTo("admin"), deletePromo);

module.exports = router;