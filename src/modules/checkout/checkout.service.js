const { prisma } = require("../../config/db");

const createOrder = async (userId, totalAmount, paymentMethod, cartItems) => {
  const order = await prisma.order.create({
    data: {
      userId: parseInt(userId),
      totalAmount: parseFloat(totalAmount),
      paymentMethod,
      orderItems: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })),
      },
    },
  });
  return order;
};

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
      productId: product.id,
      name: product.name,
      price: parseFloat((priceAfterDiscount || 0).toFixed(2)),
      quantity: item.quantity,
      total: parseFloat((priceAfterDiscount * item.quantity || 0).toFixed(2)),
    };
  });
  const total = parseFloat(cartItems.reduce((sum, item) => sum + item.total, 0).toFixed(2));
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
  createOrder,
};
