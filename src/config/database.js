const bcrypt = require('bcrypt');
const mariadb = require('mariadb');
const { Sequelize } = require('sequelize');

const dbHost = process.env.DB_HOST;
const dbPort = Number(process.env.DB_PORT || 3306);
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: process.env.DB_DIALECT || 'mariadb',
  logging: false,
  dialectOptions: {
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    allowPublicKeyRetrieval: true,
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false, require: true } } : {}),
  },
  define: {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

async function ensureDatabaseExists() {
  const pool = mariadb.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'mysql',
    connectTimeout: 60000,
    socketTimeout: 60000,
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false, require: true } } : {}),
  });

  try {
    const connection = await pool.getConnection();
    const escapedDbName = String(dbName).replace(/`/g, '``');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${escapedDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.release();
  } finally {
    await pool.end();
  }
}

async function ensureUserVerificationColumns() {
  const pool = mariadb.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    connectTimeout: 60000,
    socketTimeout: 60000,
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false, require: true } } : {}),
  });

  try {
    const connection = await pool.getConnection();
    const statements = [
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_verified` TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `verification_code` VARCHAR(6) NULL",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `verification_code_expires_at` DATETIME NULL",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `verification_attempts` INT NOT NULL DEFAULT 0",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `password_reset_code` VARCHAR(6) NULL",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `password_reset_code_expires_at` DATETIME NULL",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `password_reset_attempts` INT NOT NULL DEFAULT 0",
    ];
    for (const sql of statements) {
      await connection.query(sql);
    }
    await connection.release();
  } finally {
    await pool.end();
  }
}

async function bootstrapDefaultAdmin() {
  const User = require('../models/User');
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@epika.local';
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';

  const existingUser = await User.findOne({ where: { email: adminEmail } });
  if (existingUser) return;

  const userCount = await User.count();
  if (userCount > 0) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.create({
    username: adminUsername,
    email: adminEmail,
    password_hash: passwordHash,
    role: 'peuple',
    status: 'superadmin',
    is_banned: false,
  });

  console.log(`Default admin created with email ${adminEmail}`);
}

async function connectDB() {
  try {
    await ensureDatabaseExists();
    await ensureUserVerificationColumns();
    await sequelize.authenticate();
    console.log('MariaDB connection established successfully.');
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');
    await bootstrapDefaultAdmin();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
