// routes/students.js
const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');

const router = express.Router();

// Utility: validate Mongo ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/students  (with simple pagination: ?page=1&limit=20)
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
    const skip  = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Student.find().skip(skip).limit(limit).lean(),
      Student.countDocuments()
    ]);

    res.json({
      page, limit, total, items
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list students' });
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const s = await Student.findById(req.params.id).lean();
    if (!s) return res.status(404).json({ error: 'Student not found' });
    res.json(s);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get student' });
  }
});

// POST /api/students
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, cohort } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    }

    const created = await Student.create({ firstName, lastName, email, cohort: cohort ?? null });
    res.status(201).json(created);
  } catch (err) {
    // Handle duplicate email nicely
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT /api/students/:id
router.put('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });

    const { firstName, lastName, email, cohort } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    }

    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, cohort: cohort ?? null },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json(updated);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const removed = await Student.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Student not found' });
    res.json(removed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router;
