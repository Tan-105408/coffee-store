const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (app) => {
  app.post("/create-checkout-session", async (req, res) => {
    const cart = req.session.cart || [];
    const Product = require("../models/Product");

    try {
      const populatedCart = await Promise.all(
        cart.map(async (item) => {
          const product = await Product.findById(item.productId);
          const priceAfterDiscount = product.price * (1 - (product.discount || 0) / 100);
          return {
            name: product.name,
            price: priceAfterDiscount,
            quantity: item.quantity,
          };
        })
      );

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: populatedCart.map((item) => ({
          price_data: {
            currency: "vnd",
            product_data: { name: item.name },
            unit_amount: Math.round(item.price),
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${process.env.BASE_URL}/success`,
        cancel_url: `${process.env.BASE_URL}/cancel`,
      });

      res.json({ sessionId: session.id });
    } catch (error) {
      res.status(500).json({ message: "Lỗi tạo phiên thanh toán", error: error.message });
    }
  });
};