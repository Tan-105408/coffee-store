const router = require("express").Router();
const auth = require("../../middlewares/auth.middleware");
const restrictTo = require("../../middlewares/role.middleware");
const { prisma } = require("../../config/db");
const asyncHandler = require("../../middlewares/asyncHandler");

router.get("/", auth, restrictTo("admin"), asyncHandler(async (req, res) => {
  const rules = await prisma.voucherRule.findMany({
    include: { voucher: true },
    orderBy: { id: "desc" },
  });
  res.json(rules);
}));

router.post("/", auth, restrictTo("admin"), asyncHandler(async (req, res) => {
  const { name, triggerType, threshold, voucherId } = req.body;
  await prisma.voucherRule.create({
    data: {
      name,
      triggerType,
      threshold: parseFloat(threshold),
      voucherId: parseInt(voucherId),
      isActive: true,
    },
  });
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({ success: true });
  }
  res.redirect("/admin#voucher-rules");
}));

router.post("/:id/delete", auth, restrictTo("admin"), asyncHandler(async (req, res) => {
  await prisma.voucherRule.delete({ where: { id: parseInt(req.params.id) } });
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({ success: true });
  }
  res.redirect("/admin#voucher-rules");
}));

module.exports = router;