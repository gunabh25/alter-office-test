const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require("./middleware/rateLimiter");

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(rateLimiter);

// Swagger
const swaggerDocument = YAML.load('./openapi.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// health
app.get('/health', (req, res) => res.json({ ok: true }));

// errors
app.use(errorHandler);

module.exports = app;
