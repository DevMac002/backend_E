require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { connectDB, sequelize } = require('../src/config/database');

async function run() {
  await connectDB();
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sql.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) await sequelize.query(statement);
  }
  console.log('Migration de sécurité appliquée.');
  await sequelize.close();
}

run().catch(async (error) => {
  console.error('Échec de la migration:', error.message);
  await sequelize.close();
  process.exitCode = 1;
});
