const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const router = express.Router();

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Epika Social API',
      version: '1.0.0',
      description: 'API documentation for Epika Social backend',
    },
    servers: [
      {
        // Prefer explicit BASE_URL, then hosted platform domains, otherwise fall back to localhost.
        url: process.env.BASE_URL
          || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null)
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
          || 'http://localhost:3000',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/models/*.js', './src/services/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
router.use('/', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = router;
