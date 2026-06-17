const Cart = require("../../models/Cart");

const getCheckoutData = async (userId) => {
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || !cart.items || cart.items.length === 0) {
    return { cartItems: [], total: 0 };
  }

  const cartItems = cart.items.map((item) => {
    const product = item.productId;
    const price = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    const priceAfterDiscount = price * (1 - discount / 100);
    return {
      name: product.name,
      price: priceAfterDiscount,
      quantity: item.quantity,
      total: priceAfterDiscount * item.quantity,
    };
  });
  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  return { cartItems, total };
};

const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ userId }, { items: [] });
};

module.exports = {
  getCheckoutData,
  clearCart,
};
