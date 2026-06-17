const productService = require("./products.service");
const { prisma } = require("../../config/db");
const asyncHandler = require("../../middlewares/asyncHandler");
const ApiError = require("../../utils/ApiError");

const getProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAllProducts(req.query);
  res.json(products);
});

const getProductDetail = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  const reviews = await prisma.review.findMany({
    where: { productId: parseInt(req.params.id) },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });
  res.render("product-detail", {
    product,
    reviews,
    user: req.user || null,
  });
});

const addProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.json({ message: "Product added", product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json({ message: "Product updated", product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json({ message: "Product deleted" });
});

module.exports = {
  getProducts,
  getProductDetail,
  addProduct,
  updateProduct,
  deleteProduct,
};
