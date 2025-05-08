const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, default: "coffee" },
  discount: { type: Number, default: 0 }, // Thêm trường discount
});

module.exports = mongoose.model("Product", productSchema);