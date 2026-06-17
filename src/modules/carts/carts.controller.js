const cartService = require("./carts.service");
const asyncHandler = require("../../middlewares/asyncHandler");
const ApiError = require("../../utils/ApiError");

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCartByUserId(req.user._id);
  if (!cart || !cart.items || cart.items.length === 0) {
    return res.render("cart", { cart: [], total: 0 });
  }

  const cartItems = cart.items.map((item) => {
    const priceAfterDiscount =
      item.productId.price * (1 - (item.productId.discount || 0) / 100);
    return {
      product: item.productId,
      quantity: item.quantity,
      priceAfterDiscount,
      total: priceAfterDiscount * item.quantity,
    };
  });

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  res.render("cart", { cart: cartItems, total });
});

const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }
  const cart = await cartService.addToCart(req.user._id, productId, quantity);
  res.json({ success: true, message: "Added to cart", cart });
});

const removeItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cart = await cartService.removeFromCart(req.user._id, productId);
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }
  res.json({ success: true, message: "Removed from cart", cart });
});

module.exports = {
  getCart,
  addItemToCart,
  removeItemFromCart,
};
