// server.js
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

// ---- 1) load swagger yaml ----
const openapiPath = path.join(__dirname, 'openapi.yaml');
const openapiDoc = fs.readFileSync(openapiPath, 'utf8');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: '/openapi.yaml' }));
app.get('/openapi.yaml', (_, res) => res.type('text/yaml').send(openapiDoc));

// ---- 2) connect mongodb ----
// Set MONGODB_URI in your environment or replace with your connection string.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swagger_demo';

mongoose
  .connect(MONGODB_URI, { autoIndex: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// ---- 3) define schemas/models ----
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);
const Task = mongoose.model('Task', TaskSchema);

// ---- 4) helpers: pagination ----
function getPagination(req) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ================= USERS =================

// List users
app.get('/api/users', async (req, res) => {
  const { limit, skip } = getPagination(req);
  const users = await User.find().skip(skip).limit(limit).lean();
  res.json(users.map(u => ({ id: u._id.toString(), email: u.email, name: u.name })));
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email || !name) return res.status(400).json({ error: 'email and name are required' });
    const created = await User.create({ email, name });
    res.status(201).json({ id: created._id.toString(), email: created.email, name: created.name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user by id
app.get('/api/users/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user._id.toString(), email: user.email, name: user.name });
});

// Replace user (PUT)
app.put('/api/users/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const { email, name } = req.body || {};
  if (!email || !name) return res.status(400).json({ error: 'email and name are required' });

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { email, name },
    { new: true, runValidators: true, overwrite: true }
  ).lean();

  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ id: updated._id.toString(), email: updated.email, name: updated.name });
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const result = await User.findByIdAndDelete(req.params.id).lean();
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// ================= TASKS =================

// List tasks (optional filter ?completed=true/false)
app.get('/api/tasks', async (req, res) => {
  const { limit, skip } = getPagination(req);
  const filter = {};
  if (typeof req.query.completed !== 'undefined') {
    filter.completed = String(req.query.completed).toLowerCase() === 'true';
  }
  const tasks = await Task.find(filter).skip(skip).limit(limit).lean();
  res.json(
    tasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      completed: !!t.completed,
      userId: t.userId ? t.userId.toString() : undefined,
    }))
  );
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, completed = false, userId } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });
    const doc = { title, completed: !!completed };
    if (userId) {
      if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'invalid userId' });
      doc.userId = userId;
    }
    const created = await Task.create(doc);
    res.status(201).json({
      id: created._id.toString(),
      title: created.title,
      completed: !!created.completed,
      userId: created.userId ? created.userId.toString() : undefined,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get task by id
app.get('/api/tasks/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const t = await Task.findById(req.params.id).lean();
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: t._id.toString(),
    title: t.title,
    completed: !!t.completed,
    userId: t.userId ? t.userId.toString() : undefined,
  });
});

// Replace task (PUT)
app.put('/api/tasks/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const { title, completed } = req.body || {};
  if (typeof title !== 'string' || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'title (string) and completed (boolean) are required' });
  }
  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    { title, completed },
    { new: true, runValidators: true, overwrite: true }
  ).lean();

  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: updated._id.toString(),
    title: updated.title,
    completed: !!updated.completed,
    userId: updated.userId ? updated.userId.toString() : undefined,
  });
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const result = await Task.findByIdAndDelete(req.params.id).lean();
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// ---- 5) start ----
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API  : http://localhost:${port}`);
  console.log(`Docs : http://localhost:${port}/docs`);
});
