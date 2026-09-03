// =====================================================
// EPIKA SOCIAL - SEQUELIZE MODELS IMPLEMENTATION
// Production-ready Sequelize ORM Models
// =====================================================

/**
 * FILE STRUCTURE:
 * 
 * src/models/
 * ├── User.js
 * ├── Post.js
 * ├── Comment.js
 * ├── Reaction.js
 * ├── Story.js
 * ├── Message.js
 * ├── Conversation.js
 * ├── Group.js
 * ├── Notification.js
 * ├── Badge.js
 * ├── index.js (associations)
 * └── sequelize.js (configuration)
 */

// =====================================================
// 1. SEQUELIZE CONFIGURATION
// =====================================================

// src/models/sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'epika_social',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    
    // Performance settings
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    
    // Logging
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    logQueryParameters: process.env.NODE_ENV === 'development',
    
    // Timezone
    timezone: '+00:00',
    
    // Query execution
    benchmark: true,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      supportBigNumbers: true,
      bigNumberStrings: true,
      decimalNumbers: true,
      dateStrings: true
    },
    
    // Timestamps
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    
    // Defaults
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

module.exports = sequelize;

// =====================================================
// 2. USER MODEL
// =====================================================

// src/models/User.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  class User extends Model {
    // Instance methods
    async validatePassword(password) {
      return bcrypt.compare(password, this.password_hash);
    }

    async setPassword(password) {
      const hash = await bcrypt.hash(password, 12);
      this.password_hash = hash;
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      delete values.password_hash;
      delete values.verification_code;
      delete values.password_reset_code;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        validate: {
          len: [3, 50],
          isAlphanumeric: true,
          notEmpty: true
        },
        collate: 'utf8mb4_unicode_ci'
      },
      email: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
          notEmpty: true
        },
        collate: 'utf8mb4_unicode_ci'
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      auth_provider: {
        type: DataTypes.ENUM('local', 'google', 'facebook', 'apple'),
        defaultValue: 'local'
      },
      provider_id: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: true
      },
      avatar_path: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      cover_path: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('peuple', 'constellation', 'tornades', 'tour', 'batview'),
        defaultValue: 'peuple'
      },
      status: {
        type: DataTypes.ENUM('user', 'admin', 'superadmin'),
        defaultValue: 'user'
      },
      foi_points: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 }
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      verification_code: {
        type: DataTypes.STRING(6),
        allowNull: true
      },
      verification_code_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      verification_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_banned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      blocked_until: {
        type: DataTypes.DATE,
        allowNull: true
      },
      block_reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      access_restrictions: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Access control restrictions'
      },
      last_seen_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['username'] },
        { fields: ['email'] },
        { fields: ['created_at'] },
        { fields: ['status'] },
        { fields: ['is_verified'] },
        { fields: ['is_banned'] },
        { fields: ['last_seen_at'] },
        {
          name: 'ft_username_bio',
          type: 'FULLTEXT',
          fields: ['username', 'bio']
        }
      ]
    }
  );

  // Hooks
  User.beforeCreate(async (user) => {
    if (user.password_hash && !user.password_hash.startsWith('$2')) {
      await user.setPassword(user.password_hash);
    }
  });

  return User;
};

// =====================================================
// 3. POST MODEL
// =====================================================

// src/models/Post.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Post extends Model {}

  Post.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      content: {
        type: DataTypes.LONGTEXT,
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      type: {
        type: DataTypes.ENUM('post', 'photo', 'video', 'predication', 'annonce', 'sondage', 'quiz', 'story'),
        defaultValue: 'post'
      },
      visibility: {
        type: DataTypes.ENUM('public', 'followers', 'friends', 'private'),
        defaultValue: 'public'
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      allow_comments: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      allow_shares: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      allow_reactions: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'archived', 'deleted'),
        defaultValue: 'draft'
      },
      scheduled_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      likes_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      comments_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      shares_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      views_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      options: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Poll or quiz options'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Post',
      tableName: 'posts',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['author_id'] },
        { fields: ['type'] },
        { fields: ['visibility'] },
        { fields: ['status'] },
        { fields: ['created_at'] },
        { fields: ['author_id', 'created_at'] },
        {
          name: 'ft_content',
          type: 'FULLTEXT',
          fields: ['content']
        }
      ]
    }
  );

  return Post;
};

// =====================================================
// 4. COMMENT MODEL
// =====================================================

// src/models/Comment.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Comment extends Model {}

  Comment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'posts', key: 'id' }
      },
      author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      parent_comment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'comments', key: 'id' },
        comment: 'For nested replies'
      },
      content: {
        type: DataTypes.LONGTEXT,
        allowNull: false,
        collate: 'utf8mb4_unicode_ci'
      },
      likes_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      replies_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_edited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Comment',
      tableName: 'comments',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['post_id'] },
        { fields: ['author_id'] },
        { fields: ['parent_comment_id'] },
        { fields: ['post_id', 'created_at'] },
        {
          name: 'ft_content',
          type: 'FULLTEXT',
          fields: ['content']
        }
      ]
    }
  );

  return Comment;
};

// =====================================================
// 5. REACTION MODEL (Like, Love, Wow, Sad, Angry, Pray, Fire)
// =====================================================

// src/models/Reaction.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Reaction extends Model {}

  Reaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      entity_type: {
        type: DataTypes.ENUM('post', 'comment', 'story'),
        allowNull: false
      },
      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      reaction_type: {
        type: DataTypes.ENUM('like', 'love', 'wow', 'sad', 'angry', 'pray', 'fire'),
        defaultValue: 'like'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Reaction',
      tableName: 'reactions',
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['reaction_type'] },
        {
          unique: true,
          fields: ['user_id', 'entity_type', 'entity_id'],
          name: 'uk_user_entity_reaction'
        }
      ]
    }
  );

  return Reaction;
};

// =====================================================
// 6. STORY MODEL (24-hour ephemeral content)
// =====================================================

// src/models/Story.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Story extends Model {}

  Story.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      content: {
        type: DataTypes.LONGTEXT,
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      views_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Auto-calculated: created_at + 24 hours'
      },
      is_pinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_highlighted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Story',
      tableName: 'stories',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate(story) {
          story.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
      },
      indexes: [
        { fields: ['user_id'] },
        { fields: ['expires_at'] },
        { fields: ['created_at'] }
      ]
    }
  );

  return Story;
};

// =====================================================
// 7. MESSAGE MODEL
// =====================================================

// src/models/Message.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Message extends Model {}

  Message.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      conversation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'conversations', key: 'id' }
      },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      content: {
        type: DataTypes.LONGTEXT,
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      message_type: {
        type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'file', 'system', 'call_started', 'call_ended'),
        defaultValue: 'text'
      },
      reply_to_message_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'messages', key: 'id' }
      },
      is_edited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      reactions: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Emoji reactions on message'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['conversation_id'] },
        { fields: ['sender_id'] },
        { fields: ['is_read'] },
        { fields: ['conversation_id', 'created_at'] },
        {
          name: 'ft_content',
          type: 'FULLTEXT',
          fields: ['content']
        }
      ]
    }
  );

  return Message;
};

// =====================================================
// 8. GROUP MODEL
// =====================================================

// src/models/Group.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Group extends Model {}

  Group.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        collate: 'utf8mb4_unicode_ci'
      },
      description: {
        type: DataTypes.LONGTEXT,
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      avatar_path: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      cover_path: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      group_type: {
        type: DataTypes.ENUM('public', 'private', 'closed', 'secret'),
        defaultValue: 'public'
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      members_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      posts_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      allow_member_posts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      require_approval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      allow_comments: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Group',
      tableName: 'groups',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['creator_id'] },
        { fields: ['group_type'] },
        { fields: ['members_count'] },
        {
          name: 'ft_name_description',
          type: 'FULLTEXT',
          fields: ['name', 'description']
        }
      ]
    }
  );

  return Group;
};

// =====================================================
// 9. NOTIFICATION MODEL
// =====================================================

// src/models/Notification.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Notification extends Model {}

  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      actor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      notification_type: {
        type: DataTypes.ENUM('like', 'comment', 'follow', 'mention', 'share', 'story_view', 'message', 'group_invitation', 'group_post', 'poll_result', 'system'),
        allowNull: false
      },
      entity_type: {
        type: DataTypes.ENUM('post', 'comment', 'user', 'group', 'message', 'story'),
        allowNull: false
      },
      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        collate: 'utf8mb4_unicode_ci'
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: true
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      action_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['actor_id'] },
        { fields: ['notification_type'] },
        { fields: ['is_read'] },
        { fields: ['created_at'] }
      ]
    }
  );

  return Notification;
};

// =====================================================
// 10. BADGE MODEL & USER BADGES
// =====================================================

// src/models/Badge.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Badge extends Model {}

  Badge.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        collate: 'utf8mb4_unicode_ci'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        collate: 'utf8mb4_unicode_ci'
      },
      icon_path: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      badge_type: {
        type: DataTypes.ENUM('achievement', 'verification', 'special', 'seasonal', 'milestone'),
        allowNull: false
      },
      requirement_type: {
        type: DataTypes.ENUM('posts', 'followers', 'engagement', 'activity', 'manual'),
        allowNull: false
      },
      requirement_value: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'Badge',
      tableName: 'badges',
      timestamps: false,
      underscored: true
    }
  );

  return Badge;
};

// =====================================================
// 11. MODEL ASSOCIATIONS (index.js)
// =====================================================

// src/models/index.js
const sequelize = require('./sequelize');

const User = require('./User')(sequelize);
const Post = require('./Post')(sequelize);
const Comment = require('./Comment')(sequelize);
const Reaction = require('./Reaction')(sequelize);
const Story = require('./Story')(sequelize);
const Message = require('./Message')(sequelize);
const Group = require('./Group')(sequelize);
const Notification = require('./Notification')(sequelize);
const Badge = require('./Badge')(sequelize);

// =====================================================
// USERS ASSOCIATIONS
// =====================================================

// Posts
User.hasMany(Post, { foreignKey: 'author_id', as: 'posts', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Comments
User.hasMany(Comment, { foreignKey: 'author_id', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Self-referencing: Comments can have parent comments (replies)
Comment.hasMany(Comment, { foreignKey: 'parent_comment_id', as: 'replies', onDelete: 'CASCADE' });
Comment.belongsTo(Comment, { foreignKey: 'parent_comment_id', as: 'parentComment' });

// Followers (many-to-many self-referencing)
User.belongsToMany(User, {
  as: 'followers',
  through: 'followers',
  foreignKey: 'following_id',
  otherKey: 'follower_id',
  timestamps: false
});

User.belongsToMany(User, {
  as: 'following',
  through: 'followers',
  foreignKey: 'follower_id',
  otherKey: 'following_id',
  timestamps: false
});

// Blocks
User.belongsToMany(User, {
  as: 'blockedUsers',
  through: 'blocks',
  foreignKey: 'blocker_id',
  otherKey: 'blocked_id',
  timestamps: false
});

User.belongsToMany(User, {
  as: 'blockedBy',
  through: 'blocks',
  foreignKey: 'blocked_id',
  otherKey: 'blocker_id',
  timestamps: false
});

// =====================================================
// POSTS ASSOCIATIONS
// =====================================================

// Comments
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });

// Reactions
User.hasMany(Reaction, { foreignKey: 'user_id', as: 'reactions', onDelete: 'CASCADE' });
Post.hasMany(Reaction, { foreignKey: 'entity_id', as: 'postReactions', onDelete: 'CASCADE' });

// =====================================================
// STORIES ASSOCIATIONS
// =====================================================

User.hasMany(Story, { foreignKey: 'user_id', as: 'stories', onDelete: 'CASCADE' });
Story.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// =====================================================
// MESSAGES ASSOCIATIONS
// =====================================================

User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// =====================================================
// GROUPS ASSOCIATIONS
// =====================================================

User.hasMany(Group, { foreignKey: 'creator_id', as: 'createdGroups', onDelete: 'CASCADE' });
Group.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

User.belongsToMany(Group, {
  through: 'group_members',
  as: 'groups',
  timestamps: false
});

Group.belongsToMany(User, {
  through: 'group_members',
  as: 'members',
  timestamps: false
});

// =====================================================
// NOTIFICATIONS ASSOCIATIONS
// =====================================================

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'recipient' });

User.hasMany(Notification, { foreignKey: 'actor_id', as: 'triggeredNotifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });

// =====================================================
// BADGES ASSOCIATIONS
// =====================================================

User.belongsToMany(Badge, {
  through: 'user_badges',
  as: 'badges',
  timestamps: false
});

Badge.belongsToMany(User, {
  through: 'user_badges',
  as: 'users',
  timestamps: false
});

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  sequelize,
  User,
  Post,
  Comment,
  Reaction,
  Story,
  Message,
  Group,
  Notification,
  Badge
};

// =====================================================
// USAGE EXAMPLES
// =====================================================

/*

// CREATE A USER
const user = await User.create({
  username: 'john_doe',
  email: 'john@example.com',
  password_hash: 'SecurePassword123!',
  bio: 'Welcome to Epika Social'
});

// CREATE A POST
const post = await Post.create({
  author_id: user.id,
  content: 'This is my first post!',
  type: 'post',
  visibility: 'public'
});

// ADD A COMMENT
const comment = await Comment.create({
  post_id: post.id,
  author_id: user.id,
  content: 'Great post!'
});

// ADD A REACTION
await Reaction.create({
  user_id: user.id,
  entity_type: 'post',
  entity_id: post.id,
  reaction_type: 'love'
});

// GET USER WITH ALL DATA
const fullUser = await User.findByPk(user.id, {
  include: [
    { association: 'posts', limit: 10 },
    { association: 'followers' },
    { association: 'following' },
    { association: 'comments', limit: 5 },
    { association: 'badges' }
  ]
});

// GET POST WITH ENGAGEMENT
const postWithEngagement = await Post.findByPk(post.id, {
  include: [
    { association: 'author' },
    { association: 'comments', include: [{ association: 'author' }] },
    { association: 'postReactions' }
  ]
});

// SEARCH USERS (Full-text search)
const searchResults = await User.findAll({
  where: sequelize.where(
    sequelize.fn('MATCH', sequelize.col('username'), sequelize.col('bio')),
    sequelize.op.like,
    '%keyword%'
  )
});

// GET USER STATS WITH RAW QUERY
const stats = await sequelize.query(`
  SELECT 
    u.id,
    COUNT(DISTINCT f.follower_id) as followers_count,
    COUNT(DISTINCT p.id) as posts_count,
    COUNT(DISTINCT c.id) as comments_count,
    SUM(CASE WHEN r.reaction_type = 'like' THEN 1 ELSE 0 END) as total_likes
  FROM users u
  LEFT JOIN followers f ON u.id = f.following_id
  LEFT JOIN posts p ON u.id = p.author_id
  LEFT JOIN comments c ON u.id = c.author_id
  LEFT JOIN reactions r ON p.id = r.entity_id
  WHERE u.id = ?
  GROUP BY u.id
`, {
  replacements: [user.id],
  type: QueryTypes.SELECT
});

*/
