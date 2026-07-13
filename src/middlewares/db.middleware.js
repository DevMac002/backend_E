const { connectDB } = require('../config/database');

let dbReadyPromise = null;

async function dbMiddleware(req, res, next) {
  try {
    if (!dbReadyPromise) {
      dbReadyPromise = connectDB();
    }
    await dbReadyPromise;
    return next();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({ message: 'Base de données indisponible' });
  }
}

module.exports = dbMiddleware;
