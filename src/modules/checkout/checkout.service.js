const { prisma } = require("../../config/db");

const getCheckoutData = async (userId) => {
  const cart = await prisma.cart.findFirst({
    where: { userId: parseInt(userId) },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    return { cartItems: [], total: 0 };
  }

  const cartItems = cart.items.map((item) => {
    const product = item.product;
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
  const cart = await prisma.cart.findFirst({
    where: { userId: parseInt(userId) },
  });
  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
};

module.exports = {
  getCheckoutData,
  clearCart,
};
