const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  display_name: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
