const asyncHandler = require("../../middlewares/asyncHandler");
const promoService = require("./promotions.service");

const getAll = asyncHandler(async (req, res) => {
  const promotions = await promoService.getAll();
  res.json(promotions);
});

const createPromo = asyncHandler(async (req, res) => {
  await promoService.create(req.body);
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({ success: true });
  }
  res.redirect("/admin#promotions");
});

const deletePromo = asyncHandler(async (req, res) => {
  await promoService.remove(req.params.id);
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json"))) {
    return res.json({ success: true });
  }
  res.redirect("/admin#promotions");
});

module.exports = { getAll, createPromo, deletePromo };
