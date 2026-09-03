require('dotenv').config();

const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const http = require('http');

const { connectDB } = require('./src/config/database');

// Prevent server crashes from unhandled promise rejections and uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  try {
    // =====================================================
    // 1. INITIALISER LA BASE AVANT DE CHARGER LES MODÈLES
    // =====================================================

    await connectDB();

    console.log('✅ Base de données initialisée.');

    // =====================================================
    // 2. CHARGER L'APPLICATION APRÈS SEQUELIZE
    // =====================================================

    const { app } = require('./src/app');

    // =====================================================
    // 3. CHARGER SOCKET APRÈS SEQUELIZE
    // =====================================================

    const { initSocket } = require('./src/config/socket');

    // =====================================================
    // 4. CRÉER LE SERVEUR HTTP
    // =====================================================

    const server = http.createServer(app);

    const port = process.env.PORT || 3000;

    // =====================================================
    // 5. INITIALISER SOCKET
    // =====================================================

    initSocket(server);

    // =====================================================
    // 6. DÉMARRER LE SERVEUR
    // =====================================================

    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Epika Social API running on port ${port}`);
    });

    // =====================================================
    // 7. ARRÊT PROPRE
    // =====================================================

    function shutdown(signal) {
      console.log(`${signal} received, shutting down gracefully.`);

      server.close(() => {
        process.exit(0);
      });
    }

    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));

    return server;

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
};