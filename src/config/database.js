const bcrypt = require('bcrypt');
const mariadb = require('mariadb');
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MARIADB_URL;
const parsedDatabaseUrl = databaseUrl ? new URL(databaseUrl) : null;

const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || parsedDatabaseUrl?.hostname;
const dbPort = Number(process.env.DB_PORT || process.env.MYSQLPORT || parsedDatabaseUrl?.port || 3306);
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || parsedDatabaseUrl?.pathname?.replace(/^\//, '');
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || parsedDatabaseUrl?.username;
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || parsedDatabaseUrl?.password;
const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
const isProduction = nodeEnv === 'production';

const poolOptions = {
  max: Number(process.env.DB_POOL_MAX || 5),
  min: Number(process.env.DB_POOL_MIN || 0),
  acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
  idle: Number(process.env.DB_POOL_IDLE || 10000),
};

const sslOptions = process.env.DB_SSL === 'true'
  ? {
      ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        require: true,
      },
    }
  : {};

function createSequelizeInstance() {
  return new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: process.env.DB_DIALECT || 'mariadb',
    logging: false,
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
      allowPublicKeyRetrieval: true,
      ...sslOptions,
    },
    define: {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
    pool: poolOptions,
  });
}

const sequelize = global.__EPIKA_SEQUELIZE__ || createSequelizeInstance();
if (!global.__EPIKA_SEQUELIZE__) global.__EPIKA_SEQUELIZE__ = sequelize;

let connectPromise = global.__EPIKA_CONNECT__ || null;

async function ensureDatabaseExists() {
  if (isProduction) return;

  const pool = mariadb.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'mysql',
    connectTimeout: 60000,
    socketTimeout: 60000,
    ...sslOptions,
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
  if (isProduction) return;

  const pool = mariadb.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    connectTimeout: 60000,
    socketTimeout: 60000,
    ...sslOptions,
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
  if (isProduction) return;

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
  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        await ensureDatabaseExists();
        await ensureUserVerificationColumns();
        await sequelize.authenticate();
        console.log('MariaDB connection established successfully.');
        if (!isProduction) {
          await sequelize.sync({ alter: true });
          console.log('Database synchronized.');
          await bootstrapDefaultAdmin();
        }
        return sequelize;
      } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
      }
    })();
    global.__EPIKA_CONNECT__ = connectPromise;
  }
  return connectPromise;
}

module.exports = { sequelize, connectDB };
