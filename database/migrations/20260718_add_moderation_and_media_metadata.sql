ALTER TABLE users
  ADD COLUMN IF NOT EXISTS blocked_until DATETIME NULL,
  ADD COLUMN IF NOT EXISTS block_reason VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS access_restrictions JSON NULL;

ALTER TABLE media
  ADD COLUMN IF NOT EXISTS original_name VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS moderation_logs (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  admin_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  reason VARCHAR(500) NULL,
  expires_at DATETIME NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX moderation_logs_user_id (user_id),
  INDEX moderation_logs_admin_id (admin_id),
  INDEX moderation_logs_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  device VARCHAR(100) NOT NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  last_seen_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX user_sessions_user_id (user_id),
  INDEX user_sessions_revoked_at (revoked_at)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  status_code INT NOT NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX audit_logs_user_id (user_id),
  INDEX audit_logs_path (path),
  INDEX audit_logs_created_at (created_at)
);
