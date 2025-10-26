// routes/customers.routes.js
const express = require('express');
const mongoose = require('mongoose');
const Customer = require('../models/customer.model');

const router = express.Router();

function getPagination(req) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

// List
router.get('/', async (req, res) => {
  const { limit, skip } = getPagination(req);
  const docs = await Customer.find().skip(skip).limit(limit).lean();
  res.json(docs.map(c => ({ id: c._id.toString(), name: c.name, email: c.email, phone: c.phone, address: c.address })));
});

// Create
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
    const created = await Customer.create({ name, email, phone, address });
    res.status(201).json({ id: created._id.toString(), name: created.name, email: created.email, phone: created.phone, address: created.address });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get by id
router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const c = await Customer.findById(req.params.id).lean();
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json({ id: c._id.toString(), name: c.name, email: c.email, phone: c.phone, address: c.address });
});

// Replace (PUT)
router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const { name, email, phone, address } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
  const updated = await Customer.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, address },
    { new: true, runValidators: true, overwrite: true }
  ).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ id: updated._id.toString(), name: updated.name, email: updated.email, phone: updated.phone, address: updated.address });
});

// Delete
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const result = await Customer.findByIdAndDelete(req.params.id).lean();
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

module.exports = router;
