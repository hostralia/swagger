// routes/products.routes.js
const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/product.model');

const router = express.Router();

function getPagination(req) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

// List (optional filter ?inStock=true/false)
router.get('/', async (req, res) => {
  const { limit, skip } = getPagination(req);
  const filter = {};
  if (typeof req.query.inStock !== 'undefined') {
    filter.inStock = String(req.query.inStock).toLowerCase() === 'true';
  }
  const docs = await Product.find(filter).skip(skip).limit(limit).lean();
  res.json(docs.map(p => ({
    id: p._id.toString(), name: p.name, price: p.price, inStock: !!p.inStock, description: p.description
  })));
});

// Create
router.post('/', async (req, res) => {
  try {
    const { name, price, inStock = true, description } = req.body || {};
    if (!name || typeof price !== 'number') return res.status(400).json({ error: 'name and price (number) are required' });
    const created = await Product.create({ name, price, inStock: !!inStock, description });
    res.status(201).json({
      id: created._id.toString(), name: created.name, price: created.price, inStock: !!created.inStock, description: created.description
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get by id
router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const p = await Product.findById(req.params.id).lean();
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ id: p._id.toString(), name: p.name, price: p.price, inStock: !!p.inStock, description: p.description });
});

// Replace (PUT)
router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const { name, price, inStock, description } = req.body || {};
  if (typeof name !== 'string' || typeof price !== 'number' || typeof inStock !== 'boolean') {
    return res.status(400).json({ error: 'name (string), price (number), inStock (boolean) are required' });
  }
  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    { name, price, inStock, description },
    { new: true, runValidators: true, overwrite: true }
  ).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ id: updated._id.toString(), name: updated.name, price: updated.price, inStock: !!updated.inStock, description: updated.description });
});

// Delete
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const result = await Product.findByIdAndDelete(req.params.id).lean();
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

module.exports = router;
