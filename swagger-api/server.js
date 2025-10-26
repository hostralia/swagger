// server.js
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

// ---- Swagger (OpenAPI) ----
const openapiPath = path.join(__dirname, 'openapi.yaml');
const openapiDoc = fs.readFileSync(openapiPath, 'utf8');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: '/openapi.yaml' }));
app.get('/openapi.yaml', (_, res) => res.type('text/yaml').send(openapiDoc));

// ---- MongoDB ----
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swaggerdemo';
mongoose.connect(MONGODB_URI, { autoIndex: true })
  .then(() => console.log(' MongoDB connected'))
  .catch(err => { console.error('MongoDB connection error:', err.message); process.exit(1); });

// ---- Routes ----
const customersRouter = require('./routes/customers.routes');
const productsRouter  = require('./routes/products.routes');

app.use('/api/customers', customersRouter);
app.use('/api/products',  productsRouter);

// ---- Start ----
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API  : http://localhost:${port}`);
  console.log(`Docs : http://localhost:${port}/docs`);
});
