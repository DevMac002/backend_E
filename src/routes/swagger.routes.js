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
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);
router.use('/', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = router;
