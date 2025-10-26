// server.js
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');


const app = express();
app.use(express.json());

// ---- Swagger ----
const openapiPath = path.join(__dirname, 'openapisec.yaml'); // use your JWT version file
const openapiDoc = fs.readFileSync(openapiPath, 'utf8');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: '/openapisec.yaml' }));
app.get('/openapisec.yaml', (_, res) => res.type('text/yaml').send(openapiDoc));

// ---- MongoDB ----
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swaggerdemo';
mongoose.connect(MONGODB_URI, { autoIndex: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error('MongoDB connection error:', err.message); process.exit(1); });

// ---- Routes ----
const authRouter      = require('./routes/auth.routes');
const customersRouter = require('./routes/customers.routes');
const productsRouter  = require('./routes/products.routes');
const verifyToken     = require('./auth/verifyToken');

// Public routes
app.use('/auth', authRouter);

// Protected routes (require JWT)
app.use('/api/customers', verifyToken, customersRouter);
app.use('/api/products',  productsRouter);
// app.use('/api/products',  verifyToken, productsRouter);
// ---- Start ----
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API  : http://localhost:${port}`);
  console.log(`Docs : http://localhost:${port}/docs`);
});
