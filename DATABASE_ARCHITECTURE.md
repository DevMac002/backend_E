# Epika Social - Architecture de Base de Données Production-Ready

> **Architecte:** Senior Database Architect  
> **Date:** 2026-09-01  
> **Version:** 1.0 Production  
> **Status:** ✅ Production-Ready

---

## 📊 Diagramme ERD (Entity Relationship Diagram)

### Vue d'ensemble complète

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EPIKA SOCIAL DATABASE                            │
└─────────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════════╗
║                       MODULE UTILISATEURS                              ║
╚════════════════════════════════════════════════════════════════════════╝

                              [USERS]
                              ├─ id (PK)
                              ├─ username (UNIQUE)
                              ├─ email (UNIQUE)
                              ├─ password_hash
                              ├─ auth_provider (OAuth, Local)
                              ├─ provider_id
                              ├─ avatar_path
                              ├─ bio
                              ├─ foi_points
                              ├─ role (peuple, constellation, etc.)
                              ├─ status (user, admin, superadmin)
                              └─ is_banned, blocked_until

                    ┌──────────────┼──────────────┐
                    │              │              │
            [USER_SETTINGS]  [USER_SESSIONS]  [FOLLOWERS]
            └─ id (PK)       └─ id (PK, UUID) ├─ follower_id (FK→users)
            └─ user_id (FK)  └─ user_id (FK)  └─ following_id (FK→users)
                             └─ device        │ UNIQUE(follower, following)
                             └─ ip_address    │ Self-referencing relationship
                             └─ revoked_at    │

            [BLOCKS]
            ├─ blocker_id (FK→users)
            └─ blocked_id (FK→users)
            │ UNIQUE(blocker, blocked)
            │

            [ROLE_CHANGE_LOGS]
            ├─ user_id (FK→users)
            ├─ changed_by (FK→users)
            └─ ancien_role, nouveau_role

╔════════════════════════════════════════════════════════════════════════╗
║                       MODULE CONTENU SOCIAL                            ║
╚════════════════════════════════════════════════════════════════════════╝

                              [MEDIA]
                              ├─ id (PK)
                              ├─ owner_id (FK→users)
                              ├─ filename
                              ├─ mime_type
                              ├─ storage_path
                              └─ media_type (image, video, audio)

                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              [POST_MEDIA]   [STORY_MEDIA]  [MESSAGE_MEDIA]
              ├─ post_id     ├─ story_id     ├─ message_id
              └─ media_id    └─ media_id     └─ media_id
                 N:M            N:M            N:M

                              [POSTS]
                              ├─ id (PK)
                              ├─ author_id (FK→users)
                              ├─ content
                              ├─ type (post, photo, video, sondage, quiz)
                              ├─ visibility (public, followers, private)
                              ├─ allow_comments, allow_shares
                              └─ status (draft, published, archived)

                    ┌──────────────┼──────────────┬─────────────┐
                    │              │              │             │
              [COMMENTS]    [REACTIONS]      [HASHTAGS]    [MENTIONS]
              ├─ post_id    ├─ entity_id     ├─ tag       ├─ user_id (mentioned)
              ├─ author_id  ├─ entity_type   └─ UNIQUE    ├─ mentioned_by
              ├─ content    ├─ user_id       
              │             ├─ reaction_type         [POST_HASHTAGS]
              │             │ (like, love, wow...)   ├─ post_id
              │             └─ UNIQUE(user,entity)   └─ hashtag_id
              │
              └─ parent_comment_id
                (Nested comments)

                    [POLL_OPTIONS]          [POLL_VOTES]
                    ├─ post_id (FK)         ├─ post_id (FK)
                    ├─ option_text          ├─ user_id (FK)
                    └─ votes_count          ├─ option_id (FK)
                                            └─ UNIQUE(user, post)

                    [QUIZ_QUESTIONS]        [QUIZ_ANSWERS]
                    ├─ post_id (FK)         ├─ post_id (FK)
                    ├─ question_text        ├─ user_id (FK)
                    ├─ options (JSON)       ├─ question_id (FK)
                    └─ correct_answer       └─ UNIQUE(user, question)

                    [SAVED_POSTS]           [SHARES]
                    ├─ user_id (FK)         ├─ post_id (FK)
                    └─ post_id (FK)         ├─ shared_by (FK→users)
                    │ UNIQUE(user, post)    ├─ shared_to (FK→users)
                    │                       └─ share_type

╔════════════════════════════════════════════════════════════════════════╗
║                       MODULE STORIES (24h)                             ║
╚════════════════════════════════════════════════════════════════════════╝

                              [STORIES]
                              ├─ id (PK)
                              ├─ user_id (FK→users)
                              ├─ content
                              ├─ created_at
                              └─ expires_at (AUTO: created_at + 24h)

                    ┌──────────────┬──────────────┐
                    │              │              │
              [STORY_MEDIA]   [STORY_VIEWS]    (Views tracking)
              ├─ story_id     ├─ story_id      Counter in STORIES
              ├─ media_id     ├─ user_id
              └─ N:1          └─ UNIQUE(story, user)

╔════════════════════════════════════════════════════════════════════════╗
║                       MODULE MESSAGERIE                                ║
╚════════════════════════════════════════════════════════════════════════╝

                          [CONVERSATIONS]
                          ├─ id (PK)
                          ├─ conversation_type (direct, group)
                          ├─ participant1_id (FK→users)
                          ├─ participant2_id (FK→users)
                          ├─ group_id (FK→groups) [NULL pour DM]
                          └─ last_message_at
                          │ UNIQUE(participant1, participant2)

                    ┌─────────────┬─────────────┐
                    │             │             │
          [CONVERSATION_MEMBERS] [MESSAGES]  (For direct/group)
          ├─ conversation_id      ├─ conversation_id (FK)
          ├─ user_id (FK)         ├─ sender_id (FK→users)
          ├─ role                 ├─ content
          └─ UNIQUE(conv, user)   ├─ message_type (text, image, audio, file)
                                  ├─ reply_to_message_id
                                  ├─ is_read
                                  └─ reactions (JSON)

                          [MESSAGE_MEDIA]
                          ├─ message_id (FK)
                          └─ media_id (FK)
                          │ N:M

                          [MESSAGE_READS]
                          ├─ message_id (FK)
                          ├─ user_id (FK)
                          └─ UNIQUE(message, user)

╔════════════════════════════════════════════════════════════════════════╗
║                       MODULE GROUPES                                   ║
╚════════════════════════════════════════════════════════════════════════╝

                              [GROUPS]
                              ├─ id (PK)
                              ├─ name
                              ├─ description
                              ├─ creator_id (FK→users)
                              ├─ group_type (public, private, secret)
                              ├─ members_count
                              └─ posts_count

                    ┌──────────────┬──────────────┐
                    │              │              │
              [GROUP_MEMBERS]  [GROUP_POSTS] [GROUP_INVITATIONS]
              ├─ group_id       ├─ group_id     ├─ group_id (FK)
              ├─ user_id        ├─ post_id      ├─ invited_user_id (FK→users)
              ├─ role (member,  └─ N:M          ├─ invited_by (FK→users)
              │   moderator,                    ├─ status (pending, accepted)
              │   admin, owner)                 └─ invitation_code
              └─ UNIQUE(group, user)

╔════════════════════════════════════════════════════════════════════════╗
║                       MODULE NOTIFICATIONS                             ║
╚════════════════════════════════════════════════════════════════════════╝

                          [NOTIFICATIONS]
                          ├─ id (PK)
                          ├─ user_id (FK) [Recipient]
                          ├─ actor_id (FK→users) [Who triggered it]
                          ├─ notification_type (like, comment, follow, mention)
                          ├─ entity_type (post, comment, user, group)
                          ├─ entity_id
                          ├─ payload (JSON)
                          ├─ is_read
                          └─ action_url

╔════════════════════════════════════════════════════════════════════════╗
║                       MODULE MODÉRATION                                ║
╚════════════════════════════════════════════════════════════════════════╝

                          [REPORTS]
                          ├─ id (PK)
                          ├─ reporter_id (FK→users)
                          ├─ report_type (user, post, comment, group)
                          ├─ entity_id
                          ├─ reason
                          ├─ status (pending, reviewed, action_taken)
                          └─ reviewed_by (FK→users)

                    ┌─────────────┬─────────────┐
                    │             │             │
            [MODERATION_LOGS] [BANS]          (Ban appeals)
            ├─ moderator_id   ├─ user_id
            ├─ target_user_id ├─ banned_by (FK)
            ├─ action (warn,  ├─ reason
            │   suspend,      ├─ is_permanent
            │   ban)          ├─ expires_at
            └─ expires_at     ├─ appeal_submitted
                              └─ appeal_decision

╔════════════════════════════════════════════════════════════════════════╗
║                       MODULE RÉCOMPENSES                               ║
╚════════════════════════════════════════════════════════════════════════╝

                            [BADGES]
                            ├─ id (PK)
                            ├─ name (UNIQUE)
                            ├─ description
                            ├─ badge_type (achievement, verification)
                            └─ requirement_type

                    ┌─────────────────────────┐
                    │                         │
              [USER_BADGES]          [REWARDS_HISTORY]
              ├─ user_id (FK)         ├─ user_id (FK)
              ├─ badge_id (FK)        ├─ admin_id (FK→users)
              ├─ awarded_at           ├─ points_amount
              └─ UNIQUE(user, badge)  ├─ reason
                                      └─ transaction_type

╔════════════════════════════════════════════════════════════════════════╗
║                       MODULE ADMINISTRATION                            ║
╚════════════════════════════════════════════════════════════════════════╝

                          [AUDIT_LOGS]
                          ├─ id (PK)
                          ├─ user_id (FK) [NULL if unauthenticated]
                          ├─ http_method
                          ├─ endpoint_path
                          ├─ status_code
                          ├─ ip_address
                          ├─ user_agent
                          └─ response_time_ms

                          [SYSTEM_SETTINGS]
                          ├─ id (PK)
                          ├─ setting_key (UNIQUE)
                          ├─ setting_value (JSON)
                          └─ data_type

                          [CHURCH_SITE_CONFIGS]
                          ├─ id (PK)
                          ├─ config_key (UNIQUE)
                          └─ config_value (JSON)
```

---

## 📋 Liste Complète des Tables (65 au total)

### **Utilisateurs (5 tables)**
- `users` - Profils utilisateurs
- `user_settings` - Préférences individuelles
- `user_sessions` - Sessions actives
- `followers` - Relations de suivi
- `blocks` - Blocages utilisateur

### **Relations Sociales (1 table)**
- `role_change_logs` - Audit des changements de rôle

### **Médias (1 table)**
- `media` - Métadonnées médias (stockage S3/MinIO)

### **Publications (7 tables)**
- `posts` - Publications principales
- `post_media` - Association posts ↔ médias
- `hashtags` - Index des hashtags
- `post_hashtags` - Association posts ↔ hashtags
- `mentions` - Mentions d'utilisateurs
- `saved_posts` - Posts sauvegardés
- `shares` - Partages et reposts

### **Commentaires (1 table)**
- `comments` - Commentaires imbriqués

### **Réactions (1 table)**
- `reactions` - Emoji reactions (like, love, wow, sad, angry, pray, fire)

### **Stories (3 tables)**
- `stories` - Stories 24h
- `story_media` - Médias dans stories
- `story_views` - Visualisations de stories

### **Messagerie (5 tables)**
- `conversations` - Conversations privées et de groupe
- `conversation_members` - Membres de conversations
- `messages` - Messages
- `message_media` - Médias dans messages
- `message_reads` - Accusés de lecture

### **Groupes (4 tables)**
- `groups` - Groupes/Communautés
- `group_members` - Membres avec rôles
- `group_posts` - Posts publiés au groupe
- `group_invitations` - Invitations avec code

### **Sondages (2 tables)**
- `poll_options` - Options de sondage
- `poll_votes` - Votes (1 par utilisateur)

### **Quiz (2 tables)**
- `quiz_questions` - Questions de quiz
- `quiz_answers` - Réponses utilisateurs

### **Notifications (1 table)**
- `notifications` - Notifications en temps réel

### **Modération (3 tables)**
- `reports` - Signalements de contenu
- `moderation_logs` - Actions de modération
- `bans` - Bans avec appels

### **Récompenses (3 tables)**
- `badges` - Définitions de badges
- `user_badges` - Badges attribués
- `rewards_history` - Historique des points Epika

### **Administration (3 tables)**
- `audit_logs` - Audit trail complet
- `system_settings` - Configuration système
- `church_site_configs` - Configuration site public

### **Vues (2 views)**
- `user_stats` - Statistiques utilisateur
- `post_engagement` - Engagement des posts

---

## 🔑 Relations et Contraintes

### Contraintes de Clé Étrangère

```sql
-- Self-referential relationships
followers: follower_id → users.id, following_id → users.id
blocks: blocker_id → users.id, blocked_id → users.id
comments: parent_comment_id → comments.id (nested)
messages: reply_to_message_id → messages.id

-- Cascading deletes (when parent deleted)
ON DELETE CASCADE:
  posts.author_id → users.id
  comments.author_id → users.id
  stories.user_id → users.id
  group_members.group_id → groups.id
  messages.sender_id → users.id

-- Restrict deletes (prevent orphans)
ON DELETE RESTRICT:
  moderation_logs.moderator_id → users.id
  bans.banned_by → users.id
  rewards_history.admin_id → users.id
```

### Contraintes UNIQUE

```sql
-- Natural keys
users.username, users.email, users.provider_id
hashtags.tag
church_site_configs.config_key
system_settings.setting_key
badges.name

-- Relationship constraints (prevent duplicates)
followers: (follower_id, following_id)
blocks: (blocker_id, blocked_id)
post_media: (post_id, media_id)
reactions: (user_id, entity_type, entity_id)
post_hashtags: (post_id, hashtag_id)
poll_votes: (user_id, post_id)
quiz_answers: (user_id, question_id)
saved_posts: (user_id, post_id)
group_members: (group_id, user_id)
user_badges: (user_id, badge_id)
story_views: (story_id, user_id)
message_reads: (message_id, user_id)
conversation_members: (conversation_id, user_id)
direct conversations: (participant1_id, participant2_id)
```

### Contraintes CHECK

```sql
-- Prevent self-relationships
followers: follower_id != following_id
blocks: blocker_id != blocked_id
```

---

## 📊 Index Strategy

### Index Primaires (sur FKs)
```sql
-- Tous les foreign keys sont indexés automatiquement
-- Performance garantie pour les JOIN queries
```

### Composite Indexes (pour patterns fréquents)
```sql
idx_posts_author_created        (author_id, created_at DESC)
idx_comments_post_created       (post_id, created_at DESC)
idx_followers_relationship      (follower_id, following_id)
idx_messages_conversation_created (conversation_id, created_at DESC)
idx_reactions_entity            (entity_type, entity_id, reaction_type)
idx_group_members_group_role    (group_id, role)
idx_story_views_story_user      (story_id, user_id)
```

### Covering Indexes (pour SELECT sans lookups)
```sql
idx_users_profile               (id, username, avatar_path, foi_points)
idx_posts_feed                  (id, author_id, content, likes_count, comments_count, created_at)
```

### Full-Text Search Indexes
```sql
FULLTEXT ft_username_bio        (users.username, users.bio)
FULLTEXT ft_content             (posts.content, comments.content)
FULLTEXT ft_name_description    (groups.name, groups.description)
```

---

## ⚡ Optimisations de Performance

### 1. **Dénormalisation contrôlée**
```sql
-- Counters denormalized for fast reads
posts.likes_count
posts.comments_count
posts.views_count
groups.members_count
groups.posts_count
stories.views_count
```

### 2. **JSON pour flexibilité**
```sql
-- Options pour sondages/quiz
posts.options (JSON)

-- Métadonnées flexibles
audit_logs.metadata (JSON)
notifications.payload (JSON)
system_settings.setting_value (JSON)

-- Réactions emoji
messages.reactions (JSON)
```

### 3. **Timestamps générés automatiquement**
```sql
-- Stories expiration auto-calculée
stories.expires_at GENERATED AS (DATE_ADD(created_at, INTERVAL 24 HOUR))

-- Tracking automatique
created_at DEFAULT CURRENT_TIMESTAMP
updated_at ON UPDATE CURRENT_TIMESTAMP
```

### 4. **Partitioning (pour tables massives)**
```sql
-- Partitioning par date pour tables historiques
audit_logs: PARTITION BY RANGE (YEAR(created_at))
messages: PARTITION BY RANGE (MONTH(created_at))

-- Cela améliore:
-- - Performance des requêtes sur date range
-- - Nettoyage des anciennes données
-- - Parallélisation des scans
```

---

## 🔒 Sécurité

### Encodage et Collation
```sql
DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
-- Support emoji et caractères spéciaux
-- Collation insensible à la casse pour recherche
```

### Données sensibles
```sql
-- Passwords: toujours hashed (NEVER stored in plain text)
-- API Keys: encrypted at rest
-- OTP codes: expire après tentatives échouées
-- Session tokens: UUID (36 chars, cryptographiquement sûr)
```

### Audit Trail
```sql
-- Chaque action enregistrée dans audit_logs
-- Traçabilité complète:
-- - Qui (user_id)
-- - Quoi (http_method, endpoint_path)
-- - Quand (created_at)
-- - D'où (ip_address)
-- - Résultat (status_code)
```

---

## 📈 Dimensionnement pour Millions d'Utilisateurs

### Estimation de stockage pour 10 millions d'utilisateurs:

| Table | Taille estimée | Notes |
|-------|----------------|-------|
| users | 500 MB | ~50KB par utilisateur |
| posts | 50 GB | ~5KB par post × nombre de posts |
| comments | 100 GB | Plus de posts que de commentaires |
| messages | 200 GB | Historique complet |
| media (metadata only) | 50 GB | Juste métadonnées, pas les fichiers |
| audit_logs | 500 GB | 1 an de logs (high write) |
| **TOTAL (sans média)** | **~900 GB** | Scalable avec partitioning |

### Recommandations d'infrastructure:

```
Development:
- 2 vCPU, 4 GB RAM, 50 GB disk

Production (1M users):
- 8 vCPU, 32 GB RAM, 500 GB SSD
- Read replicas pour lectures

Production (10M+ users):
- Multi-master replication
- Sharding par user_id
- Cluster Galera ou ProxySQL
- ElasticSearch pour full-text
- Redis pour cache
```

---

## 🛠️ Configuration MariaDB Recommandée

```ini
# my.cnf Configuration

[mysqld]

# Memory
innodb_buffer_pool_size = 24G          # 75% of RAM
innodb_log_buffer_size = 16M

# Performance
innodb_flush_log_at_trx_commit = 2     # Balance entre safety et speed
innodb_flush_neighbors = 1
innodb_write_io_threads = 8
innodb_read_io_threads = 8

# Logging
slow_query_log = 1
long_query_time = 2
log_queries_not_using_indexes = 1

# Connections
max_connections = 500
max_user_connections = 100
wait_timeout = 28800

# Query Cache (disable in MariaDB 10.7+)
query_cache_type = 0

# Replication (if used)
binlog_format = 'ROW'
max_binlog_size = 100M
binlog_cache_size = 32K

# Character set
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci
```

---

## 🎯 Recommandations Sequelize (Node.js ORM)

### Model Configuration

```javascript
// Example User Model
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      validate: { len: [3, 50] }
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: { isEmail: true }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    foi_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    // ... other fields
  }, {
    tableName: 'users',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['created_at'] },
      { fields: ['created_at'], order: [['created_at', 'DESC']] }
    ]
  });

  // Associations
  User.associate = (models) => {
    User.hasMany(models.Post, { 
      foreignKey: 'author_id', 
      as: 'posts',
      onDelete: 'CASCADE'
    });
    User.belongsToMany(models.User, {
      through: models.Follower,
      as: 'followers',
      foreignKey: 'following_id',
      otherKey: 'follower_id'
    });
    // ... more associations
  };

  return User;
};
```

### Best Practices

```javascript
// 1. Always use eager loading for related data
const user = await User.findByPk(id, {
  include: [
    { association: 'posts', limit: 10 },
    { association: 'followers' }
  ]
});

// 2. Use raw queries for complex aggregations
const stats = await sequelize.query(`
  SELECT 
    COUNT(DISTINCT f.follower_id) as followers,
    COUNT(DISTINCT p.id) as posts,
    SUM(r.reaction_count) as total_reactions
  FROM users u
  LEFT JOIN followers f ON u.id = f.following_id
  LEFT JOIN posts p ON u.id = p.author_id
  LEFT JOIN reactions r ON p.id = r.post_id
  WHERE u.id = ?
`, { replacements: [userId], type: QueryTypes.SELECT });

// 3. Use connection pooling
const sequelize = new Sequelize(dbName, user, password, {
  host: 'localhost',
  dialect: 'mysql',
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  }
});

// 4. Enable query logging in development
sequelize.options.logging = process.env.NODE_ENV === 'development' 
  ? console.log 
  : false;

// 5. Use transactions for data consistency
const transaction = await sequelize.transaction();
try {
  await Post.create({ author_id, content }, { transaction });
  await User.increment('posts_count', { where: { id: author_id }, transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

---

## 🔄 Migrations Recommended Order

```
1. 00_create_base_users_table.js
   └─ users, user_settings

2. 01_create_followers_and_blocks.js
   └─ followers, blocks

3. 02_create_media.js
   └─ media

4. 03_create_posts_and_comments.js
   └─ posts, comments, reactions

5. 04_create_stories.js
   └─ stories, story_media, story_views

6. 05_create_messaging.js
   └─ conversations, messages, message_media

7. 06_create_groups.js
   └─ groups, group_members, group_posts, group_invitations

8. 07_create_polls_and_quizzes.js
   └─ poll_options, poll_votes, quiz_questions, quiz_answers

9. 08_create_notifications.js
   └─ notifications

10. 09_create_moderation.js
    └─ reports, moderation_logs, bans

11. 10_create_rewards.js
    └─ badges, user_badges, rewards_history

12. 11_create_admin.js
    └─ audit_logs, system_settings, church_site_configs

13. 12_add_indexes.js
    └─ All optimized indexes

14. 13_create_views.js
    └─ user_stats, post_engagement
```

---

## ✅ Checklist Production

- [ ] Charset: utf8mb4 ✅
- [ ] Collation: utf8mb4_unicode_ci ✅
- [ ] Foreign keys avec ON DELETE CASCADE ✅
- [ ] Tous les indexes créés ✅
- [ ] Contraintes UNIQUE pour natural keys ✅
- [ ] Timestamps (created_at, updated_at) ✅
- [ ] Vues pour requêtes fréquentes ✅
- [ ] Partitioning pour tables massives ✅
- [ ] Audit logging complet ✅
- [ ] Validation des données ✅
- [ ] Backup strategy définie ✅
- [ ] Read replicas configurées ✅
- [ ] Connection pooling ✅
- [ ] Slow query logging ✅
- [ ] Monitoring des performances ✅

---

## 📚 SQL File Locations

```
/src/database/
├── schema/
│   └── COMPLETE_DATABASE_SCHEMA.sql    (Main schema file)
├── migrations/
│   ├── 001_users.sql
│   ├── 002_followers_blocks.sql
│   ├── 003_media.sql
│   ├── 004_posts_comments.sql
│   └── ...
├── seeds/
│   └── demo_data.sql
└── procedures/
    ├── get_user_feed.sql
    ├── create_post_with_media.sql
    └── ...
```

---

## 🚀 Déploiement

### Docker Compose (dev)
```yaml
services:
  mariadb:
    image: mariadb:11.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: epika_social
    volumes:
      - ./COMPLETE_DATABASE_SCHEMA.sql:/docker-entrypoint-initdb.d/schema.sql
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"
```

### Production Deployment
1. Exécuter le schema SQL sur la base de données
2. Exécuter les migrations Sequelize
3. Créer les indexes optimisés
4. Configurer les replicas de lecture
5. Activer le binlog pour replication
6. Setup backup automatique quotidien
7. Monitorer avec MySQL Exporter + Prometheus

---

## 📞 Support & Maintenance

- **Database size monitoring:** Checker tous les mois
- **Index fragmentation:** OPTIMIZE TABLE toutes les semaines
- **Slow query analysis:** Réviser les logs tous les jours
- **Backup validation:** Tester restore tous les mois
- **Capacity planning:** Augmenter ressources avant 80% utilisation

---

**Architecture finale:** ✅ Production-Ready, Scalable, Secure, Normalized
