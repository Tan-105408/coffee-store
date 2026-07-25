const asyncHandler = require("../../middlewares/asyncHandler");
const voucherService = require("./vouchers.service");

const getAll = asyncHandler(async (req, res) => {
  const vouchers = await voucherService.getAll();
  res.json(vouchers);
});

const createVoucher = asyncHandler(async (req, res) => {
  await voucherService.create(req.body);
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({ success: true });
  }
  res.redirect("/admin#vouchers");
});

const deleteVoucher = asyncHandler(async (req, res) => {
  await voucherService.remove(req.params.id);
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({ success: true });
  }
  res.redirect("/admin#vouchers");
});

const getMyVouchers = asyncHandler(async (req, res) => {
  if (!req.user) return res.redirect("/auth/login");
  const userVouchers = await voucherService.getUserVouchers(req.user.id);
  res.render("profile", { userVouchers });
});

module.exports = { getAll, createVoucher, deleteVoucher, getMyVouchers };
