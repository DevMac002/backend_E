const bcrypt = require('bcrypt');
const mariadb = require('mariadb');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// =====================================================
// ENVIRONNEMENT
// =====================================================

const nodeEnv = (
  process.env.NODE_ENV || 'development'
).toLowerCase();

const isProduction = nodeEnv === 'production';

// =====================================================
// CONFIGURATION BASE EN LIGNE — SKYSQL
// =====================================================

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.MYSQL_URL ||
  process.env.MARIADB_URL;

const parsedDatabaseUrl = databaseUrl
  ? new URL(databaseUrl)
  : null;

const remoteConfig = {
  host:
    process.env.DB_HOST ||
    process.env.MYSQLHOST ||
    parsedDatabaseUrl?.hostname,

  port: Number(
    process.env.DB_PORT ||
    process.env.MYSQLPORT ||
    parsedDatabaseUrl?.port ||
    3306
  ),

  database:
    process.env.DB_NAME ||
    process.env.MYSQLDATABASE ||
    parsedDatabaseUrl?.pathname?.replace(/^\//, ''),

  user:
    process.env.DB_USER ||
    process.env.MYSQLUSER ||
    parsedDatabaseUrl?.username,

  password:
    process.env.DB_PASSWORD ||
    process.env.MYSQLPASSWORD ||
    parsedDatabaseUrl?.password,

  ssl: process.env.DB_SSL === 'true',
};

// =====================================================
// CONFIGURATION BASE LOCALE — MARIADB
// =====================================================

const localConfig = {
  host: process.env.DB_LOCAL_HOST || '127.0.0.1',

  port: Number(
    process.env.DB_LOCAL_PORT || 3306
  ),

  database:
    process.env.DB_LOCAL_NAME ||
    'epika_social',

  user:
    process.env.DB_LOCAL_USER ||
    'epika',

  password:
    process.env.DB_LOCAL_PASSWORD ||
    '',

  ssl: false,
};

// =====================================================
// POOL SEQUELIZE
// =====================================================

const poolOptions = {
  max: Number(process.env.DB_POOL_MAX || 5),
  min: Number(process.env.DB_POOL_MIN || 0),
  acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
  idle: Number(process.env.DB_POOL_IDLE || 10000),
};

// =====================================================
// ÉTAT GLOBAL
// =====================================================

let activeDatabase = null;
let activeConfig = null;
let sequelize = null;
let connectPromise = null;

// =====================================================
// SSL
// =====================================================

function getSslOptions(config) {
  if (!config.ssl) {
    return {};
  }

  return {
    ssl: {
      rejectUnauthorized:
        process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      require: true,
    },
  };
}

// =====================================================
// CRÉATION SEQUELIZE
// =====================================================

function createSequelizeInstance(config) {
  console.log(
    `🧩 Initialisation Sequelize: ${config.host}:${config.port}/${config.database}`
  );

  return new Sequelize(
    config.database,
    config.user,
    config.password,
    {
      host: config.host,
      port: config.port,

      dialect: process.env.DB_DIALECT || 'mariadb',

      logging: false,

      dialectOptions: {
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000,
        allowPublicKeyRetrieval: true,

        ...getSslOptions(config),
      },

      define: {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
      },

      pool: poolOptions,
    }
  );
}

// =====================================================
// TEST D'UNE BASE
// =====================================================

async function testDatabase(config, name) {
  let pool = null;
  let connection = null;

  try {
    console.log(
      `🔌 Test de connexion ${name}: ${config.host}:${config.port}`
    );

    console.log(
      `   DB=${config.database} USER=${config.user} SSL=${config.ssl}`
    );

    if (!config.host || !config.database || !config.user) {
      throw new Error(
        `Configuration ${name} incomplète`
      );
    }

    pool = mariadb.createPool({
      host: config.host,
      port: Number(config.port),
      user: config.user,
      password: config.password,
      database: config.database,

      connectTimeout: name === 'LOCALE'
        ? 5000
        : 10000,

      socketTimeout: name === 'LOCALE'
        ? 5000
        : 10000,

      ...getSslOptions(config),
    });

    connection = await pool.getConnection();

    await connection.query('SELECT 1');

    console.log(`✅ Base ${name} disponible.`);

    return true;

  } catch (error) {

    console.error(`❌ Base ${name} indisponible:`);
    console.error(`   code=${error.code || 'N/A'}`);
    console.error(`   errno=${error.errno || 'N/A'}`);
    console.error(`   sqlState=${error.sqlState || 'N/A'}`);
    console.error(`   message=${error.message}`);

    return false;

  } finally {

    if (connection) {
      try {
        connection.release();
      } catch (_) {}
    }

    if (pool) {
      try {
        await pool.end();
      } catch (_) {}
    }
  }
}

// =====================================================
// SÉLECTION AUTOMATIQUE DE LA BASE
// =====================================================

async function selectDatabase() {

  console.log('');
  console.log('==============================================');
  console.log('🔎 SÉLECTION DE LA BASE DE DONNÉES');
  console.log('==============================================');

  // ---------------------------------------------------
  // 1. SKYSQL
  // ---------------------------------------------------

  const remoteAvailable =
    await testDatabase(
      remoteConfig,
      'EN LIGNE'
    );

  if (remoteAvailable) {

    activeDatabase = 'remote';
    activeConfig = remoteConfig;

    console.log('');
    console.log(
      '🌐 Utilisation de la base de données EN LIGNE.'
    );

    return;
  }

  // ---------------------------------------------------
  // 2. FALLBACK LOCAL
  // ---------------------------------------------------

  console.warn('');
  console.warn(
    '⚠️ Base en ligne indisponible.'
  );

  console.log(
    '🔄 Tentative de basculement vers MariaDB LOCAL...'
  );

  const localAvailable =
    await testDatabase(
      localConfig,
      'LOCALE'
    );

  if (localAvailable) {

    activeDatabase = 'local';
    activeConfig = localConfig;

    console.log('');
    console.log(
      '💻 Utilisation de la base de données LOCALE.'
    );

    return;
  }

  // ---------------------------------------------------
  // 3. ÉCHEC TOTAL
  // ---------------------------------------------------

  throw new Error(
    '❌ Impossible de se connecter à la base EN LIGNE et à la base LOCALE.'
  );
}

// =====================================================
// COLONNES DE VÉRIFICATION UTILISATEUR
// =====================================================

async function ensureGoogleSubColumn() {

  if (!sequelize) {
    throw new Error(
      'Sequelize n’est pas initialisé.'
    );
  }

  await sequelize.query(
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `google_sub` VARCHAR(255) NULL"
  );
}

async function reconcileLegacySchema() {
  const migrationPath = path.join(__dirname, '../../database/migrations/20260903_reconcile_legacy_schema.sql');
  const statements = fs.readFileSync(migrationPath, 'utf8')
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sequelize.query(statement);
  }
}

async function ensureUserDeviceColumn() {

  if (!sequelize) {
    throw new Error(
      'Sequelize n’est pas initialisé.'
    );
  }

  await sequelize.query(
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `device` VARCHAR(100) NOT NULL DEFAULT 'unknown'"
  );
}

async function ensureUserVerificationColumns() {

  if (!sequelize) {
    throw new Error(
      'Sequelize n’est pas initialisé.'
    );
  }

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
    try {
      await sequelize.query(sql);
    } catch (error) {
      console.warn(
        `⚠️ Impossible d'exécuter: ${sql}`
      );

      console.warn(
        error.message
      );
    }
  }
}

// =====================================================
// ADMIN PAR DÉFAUT
// =====================================================

async function bootstrapDefaultAdmin() {

  if (isProduction) {
    return;
  }

  if (!sequelize) {
    throw new Error(
      'Sequelize n’est pas initialisé.'
    );
  }

  const User = require('../models/User');

  const adminEmail =
    process.env.DEFAULT_ADMIN_EMAIL ||
    'admin@epika.local';

  const adminUsername =
    process.env.DEFAULT_ADMIN_USERNAME ||
    'admin';

  const adminPassword =
    process.env.DEFAULT_ADMIN_PASSWORD ||
    'Admin123!';

  const existingUser =
    await User.findOne({
      where: {
        email: adminEmail,
      },
    });

  if (existingUser) {
    return;
  }

  const userCount =
    await User.count();

  if (userCount > 0) {
    return;
  }

  const passwordHash =
    await bcrypt.hash(
      adminPassword,
      10
    );

  await User.create({
    username: adminUsername,
    email: adminEmail,
    password_hash: passwordHash,
    role: 'peuple',
    status: 'superadmin',
    is_banned: false,
  });

  console.log(
    `Default admin created with email ${adminEmail}`
  );
}

// =====================================================
// CONNEXION PRINCIPALE
// =====================================================

async function connectDB() {

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {

    try {

      // -------------------------------------------------
      // 1. CHOISIR LA BASE
      // -------------------------------------------------

      await selectDatabase();

      // -------------------------------------------------
      // 2. CRÉER SEQUELIZE APRÈS LE CHOIX
      // -------------------------------------------------

      sequelize =
        global.__EPIKA_SEQUELIZE__ ||
        createSequelizeInstance(
          activeConfig
        );

      global.__EPIKA_SEQUELIZE__ =
        sequelize;

      // -------------------------------------------------
      // 3. AUTHENTIFICATION SEQUELIZE
      // -------------------------------------------------

      await sequelize.authenticate();

      await reconcileLegacySchema();
      await ensureGoogleSubColumn();
      await ensureUserDeviceColumn();

      console.log('');
      console.log(
        '✅ Connexion Sequelize établie.'
      );

      console.log(
        `📡 Base active: ${activeDatabase.toUpperCase()}`
      );

      console.log(
        `🗄️ Serveur: ${activeConfig.host}:${activeConfig.port}`
      );

      console.log(
        `📁 Base: ${activeConfig.database}`
      );

      // -------------------------------------------------
      // 4. MODIFICATIONS DEVELOPMENT
      // -------------------------------------------------

      if (!isProduction) {

        await sequelize.sync({
          alter: true,
        });

        console.log(
          '✅ Database synchronized.'
        );

        await ensureUserVerificationColumns();

        await bootstrapDefaultAdmin();
      }

      return sequelize;

    } catch (error) {

      console.error(
        '❌ Unable to connect to the database:',
        error
      );

      throw error;

    } finally {

      // Rien ici : la connexion reste active
      // pendant toute la durée de l'application.

    }

  })();

  global.__EPIKA_CONNECT__ =
    connectPromise;

  try {

    return await connectPromise;

  } finally {

    connectPromise = null;
  }
}

// =====================================================
// EXPORTS
// =====================================================

// Getter dynamique : important pour que les modèles
// récupèrent l'instance Sequelize créée après le failover.

module.exports = {
  connectDB,

  get sequelize() {
    return sequelize;
  },

  get activeDatabase() {
    return activeDatabase;
  },

  get activeConfig() {
    return activeConfig;
  },
};