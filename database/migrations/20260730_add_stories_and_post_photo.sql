CREATE TABLE IF NOT EXISTS stories (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT NULL,
  media_path VARCHAR(255) NULL,
  media_type VARCHAR(100) NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX stories_user_id (user_id),
  INDEX stories_expires_at (expires_at)
);

CREATE TABLE IF NOT EXISTS story_views (
  id INT NOT NULL AUTO_INCREMENT,
  story_id INT NOT NULL,
  user_id INT NOT NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX story_views_story_id (story_id),
  INDEX story_views_user_id (user_id)
);

ALTER TABLE posts
  MODIFY COLUMN type ENUM('post', 'predication', 'annonce', 'sondage', 'quiz', 'photo') NOT NULL DEFAULT 'post';
