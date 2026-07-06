const { prisma } = require("../../config/db");
const asyncHandler = require("../../middlewares/asyncHandler");

const getDashboard = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany();
  const orders = await prisma.order.findMany({ include: { user: true, orderItems: { include: { product: true } } } });
  res.render("admin-dashboard", { users, products, orders, user: req.user });
});

const deleteUser = asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
  res.redirect("/admin");
});

const addProduct = asyncHandler(async (req, res) => {
  const { name, price, image, category, description } = req.body;
  await prisma.product.create({
    data: { name, price: parseFloat(price), image, category, description },
  });
  res.redirect("/admin");
});

const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, image, description, category } = req.body;
  await prisma.product.update({
    where: { id: parseInt(req.params.id) },
    data: { name, price: parseFloat(price), image, description, category },
  });
  res.redirect("/admin");
});

const deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
  res.redirect("/admin");
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  await prisma.order.update({
    where: { id: parseInt(req.params.id) },
    data: { status },
  });
  res.redirect("/admin");
});

const deleteOrder = asyncHandler(async (req, res) => {
  // First delete related items
  await prisma.orderItem.deleteMany({ where: { orderId: parseInt(req.params.id) } });
  // Then delete the order
  await prisma.order.delete({ where: { id: parseInt(req.params.id) } });
  res.redirect("/admin");
});

module.exports = { getDashboard, deleteUser, addProduct, updateProduct, deleteProduct, updateOrderStatus, deleteOrder };
