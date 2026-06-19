const express = require("express");
const router = express.Router();
const { prisma } = require("../../config/db");
const auth = require("../../middlewares/auth.middleware");
const restrictTo = require("../../middlewares/role.middleware");

// Dashboard route - Admin only
router.get("/", auth, restrictTo("admin"), async (req, res) => {
  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany();
  res.render("admin-dashboard", { users, products });
});

// User Management
router.post("/users/delete/:id", auth, restrictTo("admin"), async (req, res) => {
  await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
  res.redirect("/admin");
});

// Product Management
router.post("/products/add", auth, restrictTo("admin"), async (req, res) => {
  const { name, price, image, category } = req.body;
  await prisma.product.create({ data: { name, price: parseFloat(price), image, category } });
  res.redirect("/admin");
});

router.post("/products/update/:id", auth, restrictTo("admin"), async (req, res) => {
  const { name, price, image, description } = req.body;
  await prisma.product.update({ 
    where: { id: parseInt(req.params.id) }, 
    data: { 
        name, 
        price: parseFloat(price), 
        image, 
        description 
    } 
  });
  res.redirect("/admin");
});

router.post("/products/delete/:id", auth, restrictTo("admin"), async (req, res) => {
  await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
  res.redirect("/admin");
});

module.exports = router;
