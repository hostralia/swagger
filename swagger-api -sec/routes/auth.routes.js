// routes/auth.routes.js
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Secret key — in production, move this to process.env.JWT_SECRET
const SECRET_KEY = process.env.JWT_SECRET || 'swagger_demo_secret_key';

// Demo user for testing
const DEMO_USER = {
  username: 'admin',
  password: 'Passw0rd!', // plain-text only for demo
  role: 'Manager',
};

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // simple check against demo credentials
  if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // create token payload
  const payload = {
    user: {
      username: DEMO_USER.username,
      role: DEMO_USER.role,
    },
  };

  // sign JWT (valid for 1 hour)
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

  res.json({
    token,
    expiresIn: 3600,
    user: payload.user,
  });
});

module.exports = router;
