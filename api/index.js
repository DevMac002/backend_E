const { app } = require('../src/app');

// Vercel expects the function export to be the Express app or a handler.
module.exports = app;
