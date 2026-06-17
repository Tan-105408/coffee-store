const { prisma } = require("../../config/db");

const getCartByUserId = async (userId) => {
  return await prisma.cart.findFirst({
    where: { userId: parseInt(userId) },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

const addToCart = async (userId, productId, quantity = 1) => {
  userId = parseInt(userId);
  productId = parseInt(productId);
  
  let cart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: productId,
    },
  });

  if (existingItem) {
    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    return await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: productId,
        quantity: quantity,
      },
    });
  }
};

const removeFromCart = async (userId, productId) => {
  userId = parseInt(userId);
  productId = parseInt(productId);

  const cart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!cart) {
    return null;
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: productId,
    },
  });

  if (existingItem) {
    return await prisma.cartItem.delete({
      where: { id: existingItem.id },
    });
  }

  return null;
};

module.exports = {
  getCartByUserId,
  addToCart,
  removeFromCart,
};
