const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// ---- demo data ----
const tasks = [{ id: 't_1', title: 'Sample task', completed: false }];

// ---- routes ----
app.get('/api/tasks', (req, res) => res.json(tasks));
app.post('/api/tasks', (req, res) => {
  const id = 't_' + (tasks.length + 1);
  const task = { id, title: req.body.title , completed: false };
  tasks.push(task);
  res.status(201).json(task);
});
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  return task ? res.json(task) : res.status(404).json({ error: 'Not found' });
});

// ---- swagger wiring (using the yaml file above) ----
const openapiPath = path.join(__dirname, 'openapi3.yaml');
const openapiDoc = fs.readFileSync(openapiPath, 'utf8');

// if you prefer JSdoc instead of yaml, you can configure swaggerJSDoc here.
// for now we'll just serve the YAML directly:
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: '/openapi3.yaml' }));
app.get('/openapi3.yaml', (_, res) => res.type('text/yaml').send(openapiDoc));

// start
const port = 3000;
app.listen(port, () => console.log(`API: http://localhost:${port}  |  Docs: http://localhost:${port}/docs`));
