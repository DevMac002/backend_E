require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { connectDB, sequelize } = require('../src/config/database');

async function run() {
  await connectDB();
  const migrationPath = path.join(__dirname, '../database/migrations/20260718_add_moderation_and_media_metadata.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const statements = sql.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await sequelize.query(statement);
  console.log('Migration de sécurité appliquée.');
  await sequelize.close();
}

run().catch(async (error) => {
  console.error('Échec de la migration:', error.message);
  await sequelize.close();
  process.exitCode = 1;
});
