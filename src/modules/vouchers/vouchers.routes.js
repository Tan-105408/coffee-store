const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const restrictTo = require("../../middlewares/role.middleware");
const { getAll, createVoucher, deleteVoucher } = require("./vouchers.controller");

router.get("/", auth, restrictTo("admin"), getAll);
router.post("/", auth, restrictTo("admin"), createVoucher);
router.post("/:id/delete", auth, restrictTo("admin"), deleteVoucher);

module.exports = router;