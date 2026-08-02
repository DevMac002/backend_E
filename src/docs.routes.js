const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./swagger');

const router = express.Router();

router.use('/', swaggerUi.serve, swaggerUi.setup(openapi, {
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

module.exports = router;
