const Cart = require("../../models/Cart");

const getCartByUserId = async (userId) => {
  return await Cart.findOne({ userId }).populate("items.productId");
};

const addToCart = async (userId, productId, quantity = 1) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId
  );

  if (itemIndex >= 0) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  return await cart.save();
};

const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    return null;
  }

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId
  );

  return await cart.save();
};

module.exports = {
  getCartByUserId,
  addToCart,
  removeFromCart,
};
