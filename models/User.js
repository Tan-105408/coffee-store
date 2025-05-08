const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  facebookId: { type: String },
  twoFactorSecret: { type: String },
  resetToken: { type: String },
  address: { type: String, default: "" }, // Thêm trường address
});

module.exports = mongoose.model("User", UserSchema);