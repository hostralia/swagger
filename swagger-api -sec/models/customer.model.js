// models/customer.model.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
