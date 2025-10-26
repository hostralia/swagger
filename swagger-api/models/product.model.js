// models/product.model.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true, min: 0 },
  inStock:     { type: Boolean, default: true },
  description: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
