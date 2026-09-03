-- =====================================================
-- EPIKA SOCIAL - DATABASE SCHEMA
-- Production-Ready Database Architecture
-- MySQL 8.0+ / MariaDB 11.0+
-- =====================================================
-- Charset: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- =====================================================

-- Set default charset
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =====================================================
-- MODULE 1: UTILISATEURS
-- =====================================================

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
  email VARCHAR(255) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
  password_hash VARCHAR(255) NOT NULL,
  auth_provider ENUM('local', 'google', 'facebook', 'apple') DEFAULT 'local' NOT NULL,
  provider_id VARCHAR(255) UNIQUE NULL,
  avatar_path VARCHAR(500) NULL COMMENT 'Path in MinIO/S3 storage',
  cover_path VARCHAR(500) NULL COMMENT 'Cover image path',
  bio TEXT NULL COLLATE utf8mb4_unicode_ci,
  website VARCHAR(255) NULL,
  location VARCHAR(255) NULL COLLATE utf8mb4_unicode_ci,
  phone VARCHAR(20) NULL,
  
  role ENUM('peuple', 'constellation', 'tornades', 'tour', 'batview') DEFAULT 'peuple' NOT NULL COMMENT 'Community role',
  status ENUM('user', 'admin', 'superadmin') DEFAULT 'user' NOT NULL COMMENT 'Admin status',
  
  foi_points INT DEFAULT 0 NOT NULL,
  
  is_verified BOOLEAN DEFAULT FALSE NOT NULL,
  verification_code VARCHAR(6) NULL,
  verification_code_expires_at DATETIME NULL,
  verification_attempts INT DEFAULT 0 NOT NULL,
  
  is_banned BOOLEAN DEFAULT FALSE NOT NULL,
  blocked_until DATETIME NULL COMMENT 'Temporary block expiration',
  block_reason VARCHAR(500) NULL COLLATE utf8mb4_unicode_ci,
  access_restrictions JSON DEFAULT '{}' NOT NULL COMMENT 'Access control restrictions',
  
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_username (username),
  KEY idx_email (email),
  KEY idx_created_at (created_at),
  KEY idx_status (status),
  KEY idx_is_verified (is_verified),
  KEY idx_is_banned (is_banned),
  KEY idx_last_seen_at (last_seen_at),
  FULLTEXT KEY ft_username_bio (username, bio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Core users table with authentication and profile data';

-- =====================================================

CREATE TABLE user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  
  -- Privacy settings
  is_profile_public BOOLEAN DEFAULT TRUE NOT NULL,
  allow_messages_from_anyone BOOLEAN DEFAULT TRUE NOT NULL,
  allow_notifications BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Email preferences
  email_notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  email_on_new_follower BOOLEAN DEFAULT TRUE NOT NULL,
  email_on_comment BOOLEAN DEFAULT TRUE NOT NULL,
  email_on_like BOOLEAN DEFAULT TRUE NOT NULL,
  email_on_message BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Content preferences
  language VARCHAR(10) DEFAULT 'fr' NOT NULL,
  theme ENUM('light', 'dark', 'auto') DEFAULT 'auto' NOT NULL,
  
  -- Security
  two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  two_factor_secret VARCHAR(255) NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  CONSTRAINT fk_user_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User preferences and settings';

-- =====================================================

CREATE TABLE user_sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT 'UUID v4',
  user_id INT NOT NULL,
  device VARCHAR(100) NOT NULL COLLATE utf8mb4_unicode_ci,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL COLLATE utf8mb4_unicode_ci,
  
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  revoked_at DATETIME NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_user_id (user_id),
  KEY idx_revoked_at (revoked_at),
  KEY idx_created_at (created_at),
  
  CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Active user sessions with device tracking';

-- =====================================================

CREATE TABLE role_change_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  changed_by INT NOT NULL,
  
  ancien_role VARCHAR(50) NULL COLLATE utf8mb4_unicode_ci,
  nouveau_role VARCHAR(50) NULL COLLATE utf8mb4_unicode_ci,
  ancien_statut VARCHAR(50) NULL COLLATE utf8mb4_unicode_ci,
  nouveau_statut VARCHAR(50) NULL COLLATE utf8mb4_unicode_ci,
  
  reason TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_user_id (user_id),
  KEY idx_changed_by (changed_by),
  KEY idx_created_at (created_at),
  
  CONSTRAINT fk_role_change_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_change_logs_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log for user role and status changes';

-- =====================================================
-- MODULE 2: RELATIONS SOCIALES
-- =====================================================

CREATE TABLE followers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL COMMENT 'User who follows',
  following_id INT NOT NULL COMMENT 'User being followed',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_follower_following (follower_id, following_id),
  KEY idx_following_id (following_id),
  
  CONSTRAINT fk_followers_follower_id FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_followers_following_id FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_no_self_follow CHECK (follower_id != following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User follow relationships';

-- =====================================================

CREATE TABLE blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blocker_id INT NOT NULL COMMENT 'User who blocks',
  blocked_id INT NOT NULL COMMENT 'User being blocked',
  
  reason TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_blocker_blocked (blocker_id, blocked_id),
  KEY idx_blocked_id (blocked_id),
  
  CONSTRAINT fk_blocks_blocker_id FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_blocks_blocked_id FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_no_self_block CHECK (blocker_id != blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User blocking relationships';

-- =====================================================
-- MODULE 3: MÉDIAS
-- =====================================================

CREATE TABLE media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NULL,
  
  filename VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci COMMENT 'Stored filename in S3/MinIO',
  original_name VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci COMMENT 'User uploaded filename',
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL COMMENT 'File size in bytes',
  
  storage_path VARCHAR(500) NOT NULL COLLATE utf8mb4_unicode_ci COMMENT 'Full path in S3/MinIO',
  storage_provider ENUM('minio', 's3', 'local') DEFAULT 'minio' NOT NULL,
  
  media_type ENUM('image', 'video', 'audio', 'document', 'archive') NOT NULL,
  
  -- Image metadata
  width INT NULL,
  height INT NULL,
  duration INT NULL COMMENT 'Duration in seconds for video/audio',
  
  -- Processing status
  is_processed BOOLEAN DEFAULT FALSE NOT NULL,
  is_thumbnail_generated BOOLEAN DEFAULT FALSE NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_owner_id (owner_id),
  KEY idx_created_at (created_at),
  KEY idx_media_type (media_type),
  
  CONSTRAINT fk_media_owner_id FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Media files metadata (storage references only)';

-- =====================================================
-- MODULE 4: POSTS
-- =====================================================

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL,
  
  content LONGTEXT NULL COLLATE utf8mb4_unicode_ci,
  
  type ENUM('post', 'photo', 'video', 'predication', 'annonce', 'sondage', 'quiz', 'story') 
       DEFAULT 'post' NOT NULL,
  
  visibility ENUM('public', 'followers', 'friends', 'private') DEFAULT 'public' NOT NULL,
  
  location VARCHAR(255) NULL COLLATE utf8mb4_unicode_ci,
  
  allow_comments BOOLEAN DEFAULT TRUE NOT NULL,
  allow_shares BOOLEAN DEFAULT TRUE NOT NULL,
  allow_reactions BOOLEAN DEFAULT TRUE NOT NULL,
  
  status ENUM('draft', 'published', 'archived', 'deleted') DEFAULT 'draft' NOT NULL,
  scheduled_at DATETIME NULL COMMENT 'For scheduled posts',
  
  -- Engagement counters (denormalized for performance)
  likes_count INT DEFAULT 0 NOT NULL,
  comments_count INT DEFAULT 0 NOT NULL,
  shares_count INT DEFAULT 0 NOT NULL,
  views_count INT DEFAULT 0 NOT NULL,
  
  -- Options for polls and quizzes (JSON)
  options JSON NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_author_id (author_id),
  KEY idx_type (type),
  KEY idx_visibility (visibility),
  KEY idx_status (status),
  KEY idx_created_at (created_at),
  KEY idx_scheduled_at (scheduled_at),
  FULLTEXT KEY ft_content (content),
  
  CONSTRAINT fk_posts_author_id FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Main posts/content table supporting multiple content types';

-- =====================================================

CREATE TABLE post_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  media_id INT NOT NULL,
  
  sort_order INT DEFAULT 0 NOT NULL COMMENT 'Display order in post',
  caption TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_post_media (post_id, media_id),
  KEY idx_media_id (media_id),
  
  CONSTRAINT fk_post_media_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_media_media_id FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Association between posts and media files';

-- =====================================================

CREATE TABLE hashtags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag VARCHAR(100) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
  usage_count INT DEFAULT 1 NOT NULL,
  trending_score INT DEFAULT 0 NOT NULL,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_tag (tag),
  KEY idx_usage_count (usage_count),
  KEY idx_trending_score (trending_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Hashtags index for trending and search';

-- =====================================================

CREATE TABLE post_hashtags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  hashtag_id INT NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_post_hashtag (post_id, hashtag_id),
  KEY idx_hashtag_id (hashtag_id),
  
  CONSTRAINT fk_post_hashtags_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_hashtags_hashtag_id FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Post to hashtags association';

-- =====================================================

CREATE TABLE mentions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL COMMENT 'User being mentioned',
  
  mentioned_by INT NOT NULL COMMENT 'User who made the mention',
  
  position_start INT NULL COMMENT 'Position in text',
  position_end INT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_post_user_mention (post_id, user_id),
  KEY idx_user_id (user_id),
  KEY idx_mentioned_by (mentioned_by),
  
  CONSTRAINT fk_mentions_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_mentions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_mentions_mentioned_by FOREIGN KEY (mentioned_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User mentions in posts';

-- =====================================================
-- MODULE 5: COMMENTAIRES
-- =====================================================

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  author_id INT NOT NULL,
  parent_comment_id INT NULL COMMENT 'For nested comments (replies)',
  
  content LONGTEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  
  -- Engagement counters
  likes_count INT DEFAULT 0 NOT NULL,
  replies_count INT DEFAULT 0 NOT NULL,
  
  is_edited BOOLEAN DEFAULT FALSE NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at DATETIME NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_post_id (post_id),
  KEY idx_author_id (author_id),
  KEY idx_parent_comment_id (parent_comment_id),
  KEY idx_created_at (created_at),
  FULLTEXT KEY ft_content (content),
  
  CONSTRAINT fk_comments_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author_id FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent_comment_id FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Nested comments with support for replies';

-- =====================================================
-- MODULE 6: RÉACTIONS
-- =====================================================

CREATE TABLE reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- What is being reacted to
  entity_type ENUM('post', 'comment', 'story') NOT NULL,
  entity_id INT NOT NULL COMMENT 'ID of post, comment or story',
  
  reaction_type ENUM('like', 'love', 'wow', 'sad', 'angry', 'pray', 'fire') NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_user_entity_reaction (user_id, entity_type, entity_id),
  KEY idx_entity (entity_type, entity_id),
  KEY idx_reaction_type (reaction_type),
  
  CONSTRAINT fk_reactions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Emoji reactions on posts and comments (one per user per entity)';

-- =====================================================
-- MODULE 7: SAVED AND SHARED
-- =====================================================

CREATE TABLE saved_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  
  collection_id INT NULL COMMENT 'For organizing saved posts',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_user_post (user_id, post_id),
  KEY idx_collection_id (collection_id),
  
  CONSTRAINT fk_saved_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_posts_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User saved posts collection';

-- =====================================================

CREATE TABLE shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  shared_by INT NOT NULL,
  shared_to INT NOT NULL COMMENT 'User receiving the share (for DM shares)',
  
  share_type ENUM('repost', 'private_message', 'story', 'group') DEFAULT 'repost' NOT NULL,
  message TEXT NULL COLLATE utf8mb4_unicode_ci COMMENT 'Custom message with share',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_post_id (post_id),
  KEY idx_shared_by (shared_by),
  KEY idx_shared_to (shared_to),
  
  CONSTRAINT fk_shares_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_shares_shared_by FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_shares_shared_to FOREIGN KEY (shared_to) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Post shares and reposts';

-- =====================================================
-- MODULE 8: STORIES
-- =====================================================

CREATE TABLE stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  content LONGTEXT NULL COLLATE utf8mb4_unicode_ci,
  
  -- Views tracking
  views_count INT DEFAULT 0 NOT NULL,
  
  -- Expiration (24 hours default)
  expires_at DATETIME NOT NULL GENERATED ALWAYS AS (DATE_ADD(created_at, INTERVAL 24 HOUR)) STORED,
  
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
  is_highlighted BOOLEAN DEFAULT FALSE NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_user_id (user_id),
  KEY idx_expires_at (expires_at),
  KEY idx_created_at (created_at),
  
  CONSTRAINT fk_stories_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='24-hour ephemeral stories';

-- =====================================================

CREATE TABLE story_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  media_id INT NOT NULL,
  
  sort_order INT DEFAULT 0 NOT NULL,
  duration_seconds INT DEFAULT 5 NOT NULL COMMENT 'Display duration for image',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_story_media (story_id, media_id),
  KEY idx_media_id (media_id),
  
  CONSTRAINT fk_story_media_story_id FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_story_media_media_id FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Media files in stories';

-- =====================================================

CREATE TABLE story_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  user_id INT NOT NULL,
  
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_story_user_view (story_id, user_id),
  KEY idx_user_id (user_id),
  
  CONSTRAINT fk_story_views_story_id FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_story_views_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Story views tracking';

-- =====================================================
-- MODULE 9: MESSAGERIE
-- =====================================================

CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  conversation_type ENUM('direct', 'group') NOT NULL,
  
  -- For direct conversations
  participant1_id INT NULL COMMENT 'First participant (smaller ID)',
  participant2_id INT NULL COMMENT 'Second participant (larger ID)',
  
  -- For group conversations
  group_id INT NULL,
  
  -- Conversation info
  name VARCHAR(255) NULL COLLATE utf8mb4_unicode_ci COMMENT 'For group conversations',
  avatar_path VARCHAR(500) NULL,
  
  last_message_id INT NULL,
  last_message_at DATETIME NULL,
  
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_direct_conversation (participant1_id, participant2_id),
  KEY idx_participant1_id (participant1_id),
  KEY idx_participant2_id (participant2_id),
  KEY idx_group_id (group_id),
  KEY idx_last_message_at (last_message_at),
  
  CONSTRAINT fk_conversations_participant1_id FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_participant2_id FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Direct and group conversations';

-- =====================================================

CREATE TABLE conversation_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  
  role ENUM('member', 'moderator', 'admin') DEFAULT 'member' NOT NULL,
  
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  left_at DATETIME NULL,
  
  UNIQUE KEY uk_conversation_user (conversation_id, user_id),
  KEY idx_user_id (user_id),
  
  CONSTRAINT fk_conversation_members_conversation_id FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_members_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Conversation members (for group conversations)';

-- =====================================================

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  
  -- Message content
  content LONGTEXT NULL COLLATE utf8mb4_unicode_ci,
  message_type ENUM('text', 'image', 'video', 'audio', 'file', 'system', 'call_started', 'call_ended') 
              DEFAULT 'text' NOT NULL,
  
  -- Reply to message
  reply_to_message_id INT NULL,
  
  -- Editing
  is_edited BOOLEAN DEFAULT FALSE NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_at DATETIME NULL,
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at DATETIME NULL,
  
  -- Reactions on message
  reactions JSON NULL COMMENT 'Emoji reactions on message',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_conversation_id (conversation_id),
  KEY idx_sender_id (sender_id),
  KEY idx_reply_to_message_id (reply_to_message_id),
  KEY idx_is_read (is_read),
  KEY idx_created_at (created_at),
  FULLTEXT KEY ft_content (content),
  
  CONSTRAINT fk_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender_id FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_reply_to_message_id FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Direct and group messages';

-- =====================================================

CREATE TABLE message_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  media_id INT NOT NULL,
  
  sort_order INT DEFAULT 0 NOT NULL,
  
  UNIQUE KEY uk_message_media (message_id, media_id),
  KEY idx_media_id (media_id),
  
  CONSTRAINT fk_message_media_message_id FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_media_media_id FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Media attached to messages';

-- =====================================================

CREATE TABLE message_reads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_message_user_read (message_id, user_id),
  KEY idx_user_id (user_id),
  
  CONSTRAINT fk_message_reads_message_id FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_reads_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Message read receipts for group conversations';

-- =====================================================
-- MODULE 10: GROUPES
-- =====================================================

CREATE TABLE groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
  description LONGTEXT NULL COLLATE utf8mb4_unicode_ci,
  
  avatar_path VARCHAR(500) NULL,
  cover_path VARCHAR(500) NULL,
  
  creator_id INT NOT NULL,
  
  group_type ENUM('public', 'private', 'closed', 'secret') DEFAULT 'public' NOT NULL,
  category VARCHAR(100) NULL COLLATE utf8mb4_unicode_ci,
  
  -- Engagement metrics
  members_count INT DEFAULT 1 NOT NULL,
  posts_count INT DEFAULT 0 NOT NULL,
  
  -- Settings
  allow_member_posts BOOLEAN DEFAULT TRUE NOT NULL,
  require_approval BOOLEAN DEFAULT FALSE NOT NULL,
  allow_comments BOOLEAN DEFAULT TRUE NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_name (name),
  KEY idx_creator_id (creator_id),
  KEY idx_group_type (group_type),
  KEY idx_members_count (members_count),
  KEY idx_created_at (created_at),
  FULLTEXT KEY ft_name_description (name, description),
  
  CONSTRAINT fk_groups_creator_id FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User groups/communities';

-- =====================================================

CREATE TABLE group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  
  role ENUM('member', 'moderator', 'admin', 'owner') DEFAULT 'member' NOT NULL,
  
  is_admin BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Deprecated, use role',
  
  -- Moderation
  is_muted BOOLEAN DEFAULT FALSE NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
  
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_group_user (group_id, user_id),
  KEY idx_user_id (user_id),
  KEY idx_role (role),
  
  CONSTRAINT fk_group_members_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_members_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Group membership with roles';

-- =====================================================

CREATE TABLE group_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  post_id INT NOT NULL,
  
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_group_post (group_id, post_id),
  KEY idx_group_id (group_id),
  
  CONSTRAINT fk_group_posts_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_posts_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Posts published to groups';

-- =====================================================

CREATE TABLE group_invitations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  invited_user_id INT NOT NULL,
  invited_by INT NOT NULL,
  
  status ENUM('pending', 'accepted', 'declined', 'expired') DEFAULT 'pending' NOT NULL,
  
  invitation_code VARCHAR(50) NULL UNIQUE COLLATE utf8mb4_unicode_ci,
  expires_at DATETIME NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  responded_at DATETIME NULL,
  
  UNIQUE KEY uk_group_user_invitation (group_id, invited_user_id),
  KEY idx_invited_user_id (invited_user_id),
  KEY idx_status (status),
  
  CONSTRAINT fk_group_invitations_group_id FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_invitations_invited_user_id FOREIGN KEY (invited_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_group_invitations_invited_by FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Group member invitations';

-- =====================================================
-- MODULE 11: SONDAGES
-- =====================================================

CREATE TABLE poll_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT 'Associated poll post',
  
  option_text VARCHAR(500) NOT NULL COLLATE utf8mb4_unicode_ci,
  option_index INT NOT NULL,
  
  votes_count INT DEFAULT 0 NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_post_id (post_id),
  
  CONSTRAINT fk_poll_options_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Poll answer options';

-- =====================================================

CREATE TABLE poll_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT 'Poll post',
  user_id INT NOT NULL,
  option_id INT NOT NULL,
  
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_user_poll_vote (user_id, post_id),
  KEY idx_post_id (post_id),
  KEY idx_option_id (option_id),
  
  CONSTRAINT fk_poll_votes_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_poll_votes_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_poll_votes_option_id FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User poll votes (one vote per user per poll)';

-- =====================================================
-- MODULE 12: QUIZ
-- =====================================================

CREATE TABLE quiz_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT 'Associated quiz post',
  
  question_text LONGTEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  question_index INT NOT NULL,
  
  -- Answer options (JSON array)
  options JSON NOT NULL COMMENT 'Array of answer options',
  correct_answer_index INT NOT NULL,
  
  explanation TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_post_id (post_id),
  
  CONSTRAINT fk_quiz_questions_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Quiz questions';

-- =====================================================

CREATE TABLE quiz_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT 'Quiz post',
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  
  selected_answer_index INT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_user_question_answer (user_id, question_id),
  KEY idx_post_id (post_id),
  KEY idx_question_id (question_id),
  KEY idx_is_correct (is_correct),
  
  CONSTRAINT fk_quiz_answers_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_answers_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_answers_question_id FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User quiz answers (one answer per user per question)';

-- =====================================================
-- MODULE 13: NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'Recipient',
  
  actor_id INT NOT NULL COMMENT 'User who triggered the notification',
  
  notification_type ENUM('like', 'comment', 'follow', 'mention', 'share', 'story_view', 
                        'message', 'group_invitation', 'group_post', 'poll_result', 'system') 
                  NOT NULL,
  
  entity_type ENUM('post', 'comment', 'user', 'group', 'message', 'story') NOT NULL,
  entity_id INT NOT NULL,
  
  title VARCHAR(255) NULL COLLATE utf8mb4_unicode_ci,
  content TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  payload JSON NULL COMMENT 'Additional notification data',
  
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at DATETIME NULL,
  
  action_url VARCHAR(500) NULL COMMENT 'Deep link to navigate to entity',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_user_id (user_id),
  KEY idx_actor_id (actor_id),
  KEY idx_notification_type (notification_type),
  KEY idx_is_read (is_read),
  KEY idx_created_at (created_at),
  
  CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor_id FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User notifications';

-- =====================================================
-- MODULE 14: MODÉRATION
-- =====================================================

CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL,
  
  -- What is being reported
  report_type ENUM('user', 'post', 'comment', 'story', 'group', 'message') NOT NULL,
  entity_id INT NOT NULL COMMENT 'ID of reported entity',
  
  reason VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
  description TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  status ENUM('pending', 'reviewed', 'action_taken', 'dismissed') DEFAULT 'pending' NOT NULL,
  
  reviewed_by INT NULL COMMENT 'Admin who reviewed',
  reviewed_at DATETIME NULL,
  review_notes TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  action_taken ENUM('none', 'warning', 'content_removed', 'account_suspended', 'account_banned') 
              DEFAULT 'none' NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_reporter_id (reporter_id),
  KEY idx_report_type (report_type),
  KEY idx_status (status),
  KEY idx_reviewed_by (reviewed_by),
  KEY idx_created_at (created_at),
  
  CONSTRAINT fk_reports_reporter_id FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User reports on content and users';

-- =====================================================

CREATE TABLE moderation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moderator_id INT NOT NULL,
  
  target_user_id INT NULL,
  target_entity_type ENUM('user', 'post', 'comment', 'group') NULL,
  target_entity_id INT NULL,
  
  action ENUM('warn', 'mute', 'suspend_temp', 'suspend_permanent', 'ban', 'unban', 
              'remove_content', 'restore_content', 'edit_content') NOT NULL,
  
  reason TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  details JSON NULL,
  
  duration_days INT NULL COMMENT 'For temporary actions',
  expires_at DATETIME NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_moderator_id (moderator_id),
  KEY idx_target_user_id (target_user_id),
  KEY idx_action (action),
  KEY idx_created_at (created_at),
  
  CONSTRAINT fk_moderation_logs_moderator_id FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_moderation_logs_target_user_id FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Moderation actions audit log';

-- =====================================================

CREATE TABLE bans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  
  banned_by INT NOT NULL,
  reason TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  
  is_permanent BOOLEAN DEFAULT TRUE NOT NULL,
  expires_at DATETIME NULL,
  
  appeal_submitted BOOLEAN DEFAULT FALSE NOT NULL,
  appeal_text TEXT NULL COLLATE utf8mb4_unicode_ci,
  appeal_reviewed_at DATETIME NULL,
  appeal_decision ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending' NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_banned_by (banned_by),
  KEY idx_expires_at (expires_at),
  
  CONSTRAINT fk_bans_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bans_banned_by FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Permanent and temporary bans';

-- =====================================================
-- MODULE 15: RÉCOMPENSES EPIKA
-- =====================================================

CREATE TABLE badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE COLLATE utf8mb4_unicode_ci,
  description TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  
  icon_path VARCHAR(500) NOT NULL,
  badge_type ENUM('achievement', 'verification', 'special', 'seasonal', 'milestone') NOT NULL,
  
  requirement_type ENUM('posts', 'followers', 'engagement', 'activity', 'manual') NOT NULL,
  requirement_value INT NULL,
  
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_name (name),
  KEY idx_badge_type (badge_type),
  
  UNIQUE KEY uk_badge_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Badge definitions';

-- =====================================================

CREATE TABLE user_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  
  awarded_by INT NULL,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  UNIQUE KEY uk_user_badge (user_id, badge_id),
  KEY idx_badge_id (badge_id),
  KEY idx_awarded_by (awarded_by),
  
  CONSTRAINT fk_user_badges_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_badges_badge_id FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_badges_awarded_by FOREIGN KEY (awarded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User badge awards';

-- =====================================================

CREATE TABLE rewards_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  admin_id INT NOT NULL,
  
  points_amount INT NOT NULL,
  reason TEXT NOT NULL COLLATE utf8mb4_unicode_ci,
  
  transaction_type ENUM('award', 'deduct', 'adjustment', 'penalty') DEFAULT 'award' NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_user_id (user_id),
  KEY idx_admin_id (admin_id),
  KEY idx_created_at (created_at),
  
  CONSTRAINT fk_rewards_history_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rewards_history_admin_id FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Epika points reward history';

-- =====================================================
-- MODULE 16: SITE PUBLIC
-- =====================================================

CREATE TABLE church_site_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
  
  config_value JSON NOT NULL COMMENT 'Configuration data (JSON)',
  
  description TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  created_by INT NOT NULL,
  updated_by INT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_config_key (config_key),
  
  CONSTRAINT fk_church_site_configs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_church_site_configs_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Public church website configuration (editable by admins)';

-- =====================================================
-- MODULE 17: AUDIT ET ADMINISTRATION
-- =====================================================

CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL COMMENT 'NULL for unauthenticated requests',
  
  http_method VARCHAR(10) NOT NULL,
  endpoint_path VARCHAR(500) NOT NULL COLLATE utf8mb4_unicode_ci,
  
  status_code INT NOT NULL,
  response_time_ms INT NULL COMMENT 'Response time in milliseconds',
  
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL COLLATE utf8mb4_unicode_ci,
  
  request_body_hash VARCHAR(64) NULL COMMENT 'SHA256 hash of request body',
  error_message TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  metadata JSON NULL COMMENT 'Additional context data',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_user_id (user_id),
  KEY idx_http_method (http_method),
  KEY idx_status_code (status_code),
  KEY idx_created_at (created_at),
  KEY idx_endpoint_path (endpoint_path),
  
  CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Complete audit trail of all API requests and changes';

-- =====================================================

CREATE TABLE system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL COLLATE utf8mb4_unicode_ci,
  setting_value JSON NOT NULL,
  
  data_type ENUM('string', 'integer', 'boolean', 'json', 'array') DEFAULT 'string' NOT NULL,
  description TEXT NULL COLLATE utf8mb4_unicode_ci,
  
  is_environment_override BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Can be overridden by env var',
  
  created_by INT NOT NULL,
  updated_by INT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  KEY idx_setting_key (setting_key),
  
  CONSTRAINT fk_system_settings_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_system_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System-wide configuration settings';

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

CREATE VIEW user_stats AS
SELECT 
  u.id,
  u.username,
  COUNT(DISTINCT f.follower_id) as followers_count,
  COUNT(DISTINCT f2.following_id) as following_count,
  COUNT(DISTINCT p.id) as posts_count,
  COUNT(DISTINCT r.id) as reactions_count,
  u.foi_points,
  u.created_at
FROM users u
LEFT JOIN followers f ON u.id = f.following_id AND f.following_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = f.follower_id)
LEFT JOIN followers f2 ON u.id = f2.follower_id
LEFT JOIN posts p ON u.id = p.author_id
LEFT JOIN reactions r ON u.id = r.user_id
GROUP BY u.id;

-- =====================================================

CREATE VIEW post_engagement AS
SELECT 
  p.id,
  p.author_id,
  COUNT(DISTINCT r.id) as total_reactions,
  SUM(CASE WHEN r.reaction_type = 'like' THEN 1 ELSE 0 END) as likes_count,
  COUNT(DISTINCT c.id) as comments_count,
  COUNT(DISTINCT s.id) as shares_count,
  COUNT(DISTINCT sv.id) as views_count
FROM posts p
LEFT JOIN reactions r ON p.id = r.entity_id AND r.entity_type = 'post'
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN shares s ON p.id = s.post_id
LEFT JOIN story_views sv ON p.id = sv.story_id
GROUP BY p.id;

-- =====================================================
-- INDEX OPTIMIZATION FOR COMMON QUERIES
-- =====================================================

-- Composite indexes for frequently joined queries
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX idx_followers_relationship ON followers(follower_id, following_id);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_reactions_entity ON reactions(entity_type, entity_id, reaction_type);
CREATE INDEX idx_group_members_group_role ON group_members(group_id, role);
CREATE INDEX idx_story_views_story_user ON story_views(story_id, user_id);

-- Covering indexes for frequently selected columns
CREATE INDEX idx_users_profile ON users(id, username, avatar_path, foi_points);
CREATE INDEX idx_posts_feed ON posts(id, author_id, content, likes_count, comments_count, created_at);

-- =====================================================
-- PERFORMANCE RECOMMENDATIONS
-- =====================================================

/*
MARIAB CONFIGURATION RECOMMENDATIONS:

1. Buffer Pool Size:
   SET GLOBAL innodb_buffer_pool_size = RAM * 0.75

2. Query Cache (disable in MariaDB 10.7+):
   query_cache_type = 0
   
3. Logging:
   slow_query_log = 1
   long_query_time = 2
   log_queries_not_using_indexes = 1
   
4. Replication (if needed):
   binlog_format = 'ROW'
   max_binlog_size = 100M
   
5. InnoDB specific:
   innodb_flush_log_at_trx_commit = 2 (for balance between safety and speed)
   innodb_log_file_size = 500M
   innodb_write_io_threads = 8
   innodb_read_io_threads = 8

6. Connection pool:
   max_connections = 500
   max_user_connections = 100
*/

-- =====================================================
-- SEEDING RECOMMENDATIONS FOR SEQUELIZE
-- =====================================================

/*
SEQUELIZE MODEL ASSOCIATIONS:

User.hasMany(Posts, { foreignKey: 'author_id', as: 'posts' })
User.hasMany(Comments, { foreignKey: 'author_id', as: 'comments' })
User.hasMany(Followers, { foreignKey: 'following_id', as: 'followers' })
User.hasMany(Followers, { foreignKey: 'follower_id', as: 'following' })
User.hasMany(Blocks, { foreignKey: 'blocker_id', as: 'blockedUsers' })
User.hasMany(Blocks, { foreignKey: 'blocked_id', as: 'blockedBy' })
User.belongsToMany(Badges, { through: UserBadges })

Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' })
Post.hasMany(Comments, { foreignKey: 'post_id', as: 'comments', onDelete: 'CASCADE' })
Post.hasMany(Reactions, { foreignKey: 'entity_id', as: 'reactions' })
Post.belongsToMany(Media, { through: PostMedia })
Post.belongsToMany(Hashtags, { through: PostHashtags })
Post.hasMany(PollVotes, { foreignKey: 'post_id' })
Post.hasMany(QuizAnswers, { foreignKey: 'post_id' })

Group.hasMany(GroupMembers, { foreignKey: 'group_id', onDelete: 'CASCADE' })
Group.hasMany(GroupPosts, { foreignKey: 'group_id', onDelete: 'CASCADE' })
Group.belongsToMany(Users, { through: GroupMembers })

Conversation.belongsToMany(Users, { through: ConversationMembers })
Conversation.hasMany(Messages, { foreignKey: 'conversation_id', onDelete: 'CASCADE' })

INDEXING STRATEGY:
- Always index foreign keys
- Create composite indexes for WHERE + ORDER BY combinations
- Use covering indexes for read-heavy queries
- Monitor slow query log regularly
- Use EXPLAIN ANALYZE for optimization
*/

-- =====================================================
-- END OF DATABASE SCHEMA
-- =====================================================
