const { Sequelize } = require('sequelize');
const { connectDB } = require('../src/config/database');

async function runMigration(direction) {
  await connectDB();
  const { sequelize } = require('../src/config/database');
  const queryInterface = sequelize.getQueryInterface();

  if (direction === 'up') {
    await queryInterface.createTable('media', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      filename: { type: Sequelize.STRING(255), allowNull: false },
      mime_type: { type: Sequelize.STRING(100), allowNull: false },
      size: { type: Sequelize.INTEGER, allowNull: false },
      owner_id: { type: Sequelize.INTEGER, allowNull: true },
      data: { type: Sequelize.BLOB('long'), allowNull: false },
      type: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'generic' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    console.log('Migration up completed: media table created.');
  } else if (direction === 'down') {
    await queryInterface.dropTable('media');
    console.log('Migration down completed: media table dropped.');
  } else {
    console.error('Usage: node migrations/20260713-create-media.js <up|down>');
    process.exit(1);
  }
}

runMigration(process.argv[2]).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
