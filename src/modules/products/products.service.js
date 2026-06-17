const { prisma } = require("../../config/db");

const getAllProducts = async (filters) => {
  const { search, category, minPrice, maxPrice } = filters;
  let where = {};
  if (search) {
    where.name = { contains: search };
  }
  if (category) {
    where.category = category;
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  return await prisma.product.findMany({ where });
};

const getProductById = async (id) => {
  return await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });
};

const createProduct = async (productData) => {
  return await prisma.product.create({
    data: productData,
  });
};

const updateProduct = async (id, productData) => {
  return await prisma.product.update({
    where: { id: parseInt(id) },
    data: productData,
  });
};

const deleteProduct = async (id) => {
  return await prisma.product.delete({
    where: { id: parseInt(id) },
  });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
