require('dotenv').config();
const http = require('http');
const { app } = require('./src/app');
const { connectDB } = require('./src/config/database');
const { initSocket } = require('./src/config/socket');

const server = http.createServer(app);

function startServer() {
  return connectDB().then(() => {
    const port = process.env.PORT || 3000;
    initSocket(server);
    return server.listen(port, () => {
      console.log(`Epika Social API running on port ${port}`);
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start server:', error);
    process.exit(1);
  });
}

module.exports = { app, server, startServer };
