module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('posts', 'location', { type: Sequelize.STRING(150), allowNull: true });
    await queryInterface.addColumn('posts', 'hide_like_count', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn('posts', 'disable_comments', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn('posts', 'scheduled_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('posts', 'status', {
      type: Sequelize.ENUM('published', 'scheduled'),
      allowNull: false,
      defaultValue: 'published',
    });
    await queryInterface.addColumn('posts', 'tagged_user_ids', { type: Sequelize.JSON, allowNull: true });

    // MySQL : changeColumn suffit. PostgreSQL : ALTER TYPE ... ADD VALUE
    // ne peut pas s'exécuter dans une transaction — dis-moi ton SGBD si
    // cette étape échoue, je l'adapte.
    await queryInterface.changeColumn('posts', 'visible_to', {
      type: Sequelize.ENUM('all', 'followers', 'only_me'),
      defaultValue: 'all',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('posts', 'location');
    await queryInterface.removeColumn('posts', 'hide_like_count');
    await queryInterface.removeColumn('posts', 'disable_comments');
    await queryInterface.removeColumn('posts', 'scheduled_at');
    await queryInterface.removeColumn('posts', 'status');
    await queryInterface.removeColumn('posts', 'tagged_user_ids');
    await queryInterface.changeColumn('posts', 'visible_to', {
      type: Sequelize.ENUM('all'),
      defaultValue: 'all',
    });
  },
};