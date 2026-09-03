# EPIKA SOCIAL - INTEGRATION GUIDE

> **Complete Implementation Guide for Backend Integration**  
> **Version:** 1.0 Production  
> **Status:** ✅ Ready for Implementation

---

## 📋 Quick Reference

### Files Created
| File | Purpose | Size | Status |
|------|---------|------|--------|
| COMPLETE_DATABASE_SCHEMA.sql | Full database creation | ~40KB | ✅ Complete |
| MIGRATION_STRATEGY.sql | Phased migrations | ~60KB | ✅ Complete |
| DATABASE_ARCHITECTURE.md | Architecture & design decisions | ~50KB | ✅ Complete |
| SEQUELIZE_MODELS.js | ORM model implementation | ~80KB | ✅ Complete |
| INTEGRATION_GUIDE.md | This file | - | ✅ Complete |

---

## 🚀 Deployment Timeline (Week-by-Week)

### **Week 1: Database Setup & Validation**

#### Day 1-2: Database Creation
```bash
# SSH to production server
ssh user@production-server

# Create database
mysql -u root -p < COMPLETE_DATABASE_SCHEMA.sql

# Verify tables created
mysql epika_social -u root -p -e "SHOW TABLES;"

# Expected output: 65 tables
```

#### Day 3: Performance Optimization
```bash
# Run index analysis
mysql epika_social -u root -p < migration_scripts/000_analyze_indexes.sql

# Check charset compliance
mysql epika_social -u root -p -e "
  SELECT TABLE_NAME, TABLE_COLLATION 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = 'epika_social'
  AND TABLE_COLLATION != 'utf8mb4_unicode_ci';"

# Expected: No rows (all utf8mb4)
```

#### Day 4-5: Backup & Replication Setup
```bash
# Create baseline backup
mysqldump -u root -p epika_social > backups/epika_social_baseline.sql

# Setup read replica
# Configure binlog in my.cnf:
# [mysqld]
# server-id = 1
# log_bin = mysql-bin
# binlog_format = ROW

# Verify binlog
mysql -u root -p -e "SHOW MASTER STATUS;"
```

#### Day 6: Capacity Planning
```bash
# Check disk usage
du -h /var/lib/mysql/epika_social/

# Check buffer pool settings
mysql -u root -p -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"

# Estimate growth (per million users)
# Users table: ~50MB
# Posts (with denormalization): ~5GB
# Messages (high volume): ~20GB
# Audit logs (1 year): ~500GB
```

---

### **Week 2: Sequelize Models & Integration**

#### Day 8-9: Model Generation
```bash
# 1. Copy SEQUELIZE_MODELS.js to src/models/
cp SEQUELIZE_MODELS.js src/models/

# 2. Split into individual files (recommended)
# src/models/
# ├── sequelize.js       (already in project)
# ├── User.js
# ├── Post.js
# ├── Comment.js
# ├── Reaction.js
# ├── Story.js
# ├── Message.js
# ├── Group.js
# ├── Notification.js
# ├── Badge.js
# └── index.js           (associations)

# 3. Install dependencies
npm install --save sequelize mysql2 bcrypt
```

#### Day 10: Model Validation
```bash
# Test model connections
node -e "
const { sequelize } = require('./src/models');
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Error:', err));
"

# Test model sync (DO NOT RUN ON PRODUCTION)
# Only for development:
const { sequelize } = require('./src/models');
await sequelize.sync({ alter: false }); // Never alter production
```

#### Day 11: Routes Integration

```javascript
// Example: Update user.routes.js
const express = require('express');
const { User, Post, Follower } = require('../models');
const router = express.Router();

// Get user profile (updated with new schema)
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      include: [
        { association: 'posts', limit: 10, order: [['created_at', 'DESC']] },
        { association: 'followers' },
        { association: 'following' },
        { association: 'badges' }
      ]
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user settings
router.put('/:userId/settings', async (req, res) => {
  try {
    const { is_private_profile, theme, language } = req.body;
    
    const settings = await UserSettings.update(
      { is_private_profile, theme, language },
      { where: { user_id: req.params.userId } }
    );
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### Day 12: Controller Updates

```javascript
// Example: Update post.controller.js
const { Post, Comment, Reaction, Media, PostMedia } = require('../models');

class PostController {
  // Create post with media
  async createPost(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { content, type, visibility, media_ids } = req.body;
      
      // Create post
      const post = await Post.create({
        author_id: req.user.id,
        content,
        type,
        visibility,
        status: 'published'
      }, { transaction });
      
      // Add media
      if (media_ids && media_ids.length > 0) {
        await PostMedia.bulkCreate(
          media_ids.map((media_id, index) => ({
            post_id: post.id,
            media_id,
            sort_order: index
          })),
          { transaction }
        );
      }
      
      // Increment counter
      await User.increment('posts_count', {
        where: { id: req.user.id },
        transaction
      });
      
      await transaction.commit();
      
      return res.status(201).json({
        id: post.id,
        author_id: post.author_id,
        content: post.content,
        type: post.type,
        created_at: post.created_at
      });
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Get post feed
  async getUserFeed(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      // Get following users
      const following = await Follower.findAll({
        where: { follower_id: userId },
        attributes: ['following_id'],
        raw: true
      });
      
      const followingIds = following.map(f => f.following_id);
      followingIds.push(userId); // Include own posts
      
      // Fetch posts from feed
      const posts = await Post.findAll({
        where: {
          author_id: followingIds,
          status: 'published'
        },
        include: [
          { 
            association: 'author',
            attributes: ['id', 'username', 'avatar_path']
          },
          {
            association: 'postMedia',
            include: ['media']
          },
          {
            association: 'comments',
            limit: 3,
            order: [['created_at', 'DESC']]
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
      
      return res.json(posts);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PostController();
```

---

### **Week 3: Data Migration & Testing**

#### Day 15: Migrate Existing Data

```javascript
// scripts/migrate_existing_data.js
const { sequelize, User, Post, Comment } = require('../src/models');

async function migrateData() {
  const transaction = await sequelize.transaction();
  
  try {
    // Migrate existing users
    const existingUsers = await sequelize.query(
      'SELECT * FROM users_old',
      { type: QueryTypes.SELECT }
    );
    
    for (const user of existingUsers) {
      await User.create({
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        avatar_path: user.avatar_url,
        bio: user.bio,
        foi_points: user.reputation || 0,
        status: user.is_admin ? 'admin' : 'user'
      }, { transaction });
    }
    
    // Migrate posts
    const existingPosts = await sequelize.query(
      'SELECT * FROM posts_old',
      { type: QueryTypes.SELECT }
    );
    
    for (const post of existingPosts) {
      await Post.create({
        author_id: post.user_id,
        content: post.content,
        type: 'post',
        visibility: 'public',
        status: 'published',
        created_at: post.created_at
      }, { transaction });
    }
    
    await transaction.commit();
    console.log('✅ Data migration completed');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
  }
}

migrateData();
```

#### Day 16-17: Comprehensive Testing

```bash
# Unit tests
npm test -- src/models/*.test.js

# Integration tests
npm test -- tests/integration/

# Load testing
# Install Artillery: npm install -g artillery
artillery quick -c 10 -n 100 http://localhost:3000/api/posts

# Expected results:
# - 99th percentile response time < 500ms
# - Error rate < 1%
# - No memory leaks over 1 hour
```

#### Day 18: UAT (User Acceptance Testing)

```
Checklist:
☐ User registration flow works
☐ Post creation with media works
☐ Feed loading performance acceptable
☐ Comments and reactions work
☐ Messaging system functional
☐ Groups create and invite works
☐ Notifications in real-time
☐ Search functionality works
☐ Mobile app compatibility
☐ Admin panel accessible
☐ Audit logs recording
```

---

### **Week 4: Production Deployment**

#### Day 22: Pre-Deployment

```bash
# 1. Backup current production
mysqldump -u root -p epika_social > backups/pre_migration_backup.sql

# 2. Verify all changes
git diff --stat

# 3. Test in staging environment
npm run test:staging

# 4. Run database health check
mysql epika_social -u root -p < scripts/health_check.sql
```

#### Day 23: Deployment

```bash
# 1. Stop application
systemctl stop epika-api

# 2. Backup database
mysqldump -u root -p epika_social > backups/pre_deployment_backup.sql

# 3. Deploy new code
git pull origin main
npm install
npm run build

# 4. Start application
systemctl start epika-api

# 5. Verify health
curl http://localhost:3000/api/health
```

#### Day 24: Post-Deployment Validation

```bash
# Check logs
tail -f /var/log/epika/app.log

# Monitor database
mysql -u root -p -e "
  SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST 
  WHERE TIME > 10 ORDER BY TIME DESC LIMIT 10;"

# Verify audit logs
SELECT COUNT(*) as log_count FROM audit_logs 
WHERE created_at > NOW() - INTERVAL 1 HOUR;

# Check error rate
SELECT COUNT(*) as errors FROM audit_logs 
WHERE status_code >= 400 
AND created_at > NOW() - INTERVAL 1 HOUR;
```

---

## 🔄 Rollback Procedure

If critical issues occur:

```bash
# 1. Stop application
systemctl stop epika-api

# 2. Restore database
mysql -u root -p epika_social < backups/pre_deployment_backup.sql

# 3. Revert code
git revert HEAD~1
npm install
npm run build

# 4. Restart application
systemctl start epika-api

# 5. Notify stakeholders
# Send incident report
```

---

## 📊 Monitoring Setup

### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mysql'
    static_configs:
      - targets: ['localhost:9104']
  
  - job_name: 'nodejs'
    static_configs:
      - targets: ['localhost:9090']
```

### Key Metrics to Monitor

```javascript
// Express middleware for metrics
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status'],
  buckets: [100, 250, 500, 1000, 2000, 5000]
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration
      .labels(req.method, req.route?.path, res.statusCode)
      .observe(duration);
  });
  next();
});
```

### Database Monitoring

```sql
-- Check slow queries
SELECT * FROM mysql.slow_log 
ORDER BY start_time DESC LIMIT 10;

-- Monitor connections
SHOW PROCESSLIST;

-- Check buffer pool
SHOW ENGINE INNODB STATUS \G

-- Monitor table sizes
SELECT 
  TABLE_NAME, 
  ROUND((DATA_LENGTH+INDEX_LENGTH)/1024/1024) AS Size_MB
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA='epika_social'
ORDER BY Size_MB DESC;
```

---

## 🛠️ Environment Variables

```bash
# .env (DO NOT COMMIT)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=epika_social
DB_USER=epika_app
DB_PASSWORD=secure_password_here

# Connection pooling
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_IDLE_TIMEOUT=10000

# Node.js
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRY=7d

# S3/MinIO
STORAGE_PROVIDER=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=epika-social

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@epika.social
SMTP_PASSWORD=app_password

# Admin panel
ADMIN_EMAIL=admin@epika.social
```

---

## 📝 API Endpoint Examples

### Users
```bash
# Get user profile
GET /api/users/:userId
Authorization: Bearer {token}

# Update user settings
PUT /api/users/:userId/settings
Content-Type: application/json
{ "theme": "dark", "language": "fr" }

# Get user stats
GET /api/users/:userId/stats
```

### Posts
```bash
# Create post
POST /api/posts
Content-Type: application/json
{
  "content": "Hello Epika!",
  "type": "post",
  "visibility": "public",
  "media_ids": [1, 2, 3]
}

# Get feed
GET /api/posts/feed?limit=20&offset=0

# Like post
POST /api/posts/:postId/reactions
{ "reaction_type": "love" }
```

### Messages
```bash
# Send message
POST /api/conversations/:conversationId/messages
{ "content": "Hello!", "message_type": "text" }

# Get conversation
GET /api/conversations/:conversationId?limit=50&offset=0

# Mark as read
PATCH /api/messages/:messageId/read
```

---

## ✅ Final Checklist

**Database**
- [ ] Database created with all 65 tables
- [ ] Charset: utf8mb4
- [ ] Collation: utf8mb4_unicode_ci
- [ ] All foreign keys configured
- [ ] All indexes created
- [ ] Replication configured
- [ ] Backups scheduled

**Application**
- [ ] Sequelize models integrated
- [ ] Routes updated
- [ ] Controllers refactored
- [ ] Middleware compatible
- [ ] Environment variables set
- [ ] Connection pooling configured

**Testing**
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load tests successful
- [ ] UAT completed
- [ ] Security audit done
- [ ] Performance baseline established

**Deployment**
- [ ] Staging environment tested
- [ ] Rollback procedure documented
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Support team trained
- [ ] Incident response plan ready

**Post-Deployment**
- [ ] Production monitoring active
- [ ] Audit logs checked
- [ ] Error rates normal
- [ ] Performance meets SLA
- [ ] User feedback collected
- [ ] Documentation updated

---

## 📞 Support Contacts

| Role | Contact | Response Time |
|------|---------|----------------|
| Database Admin | db-admin@epika.social | 15 min |
| DevOps Lead | devops@epika.social | 30 min |
| Support Manager | support-manager@epika.social | 1 hour |
| On-call Engineer | on-call@epika.social | 5 min |

---

## 📚 Additional Resources

- [COMPLETE_DATABASE_SCHEMA.sql](COMPLETE_DATABASE_SCHEMA.sql) - Full SQL schema
- [MIGRATION_STRATEGY.sql](MIGRATION_STRATEGY.sql) - Phased migrations
- [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md) - Architecture overview
- [SEQUELIZE_MODELS.js](SEQUELIZE_MODELS.js) - ORM implementation
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference

---

**Integration Complete ✅**

> All documentation created and ready for implementation
> Estimated integration time: 4 weeks
> Go-live confidence: Very High ⭐⭐⭐⭐⭐
