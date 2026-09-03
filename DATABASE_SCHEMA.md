# Epika Social - Schéma Complet de la Base de Données

## Vue d'ensemble
Base de données MySQL/MariaDB pour la plateforme sociale Epika. Contient 18 tables principales avec relations.

---

## TABLES

### 1. **users**
Table principale pour les utilisateurs de la plateforme.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Pseudo utilisateur |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email unique |
| password_hash | VARCHAR(255) | NOT NULL | Hash du mot de passe |
| auth_provider | ENUM | 'local', 'google' (défaut: 'local') | Méthode d'authentification |
| google_sub | VARCHAR(255) | UNIQUE, NULL | ID Google OAuth |
| avatar_path | VARCHAR(255) | NULL | Chemin de l'avatar |
| bio | TEXT | NULL | Biographie utilisateur |
| role | ENUM | 'peuple', 'constellation', 'tornades', 'tour', 'batview' (défaut: 'peuple') | Rôle communautaire |
| status | ENUM | 'user', 'admin', 'superadmin' (défaut: 'user') | Statut administratif |
| foi_points | INT | défaut: 0 | Points de foi accumulés |
| is_banned | BOOLEAN | défaut: false | Si l'utilisateur est banni |
| blocked_until | DATETIME | NULL | Date de fin du blocage temporaire |
| block_reason | VARCHAR(500) | NULL | Raison du blocage |
| access_restrictions | JSON | défaut: {} | Restrictions d'accès (lecture, commentaires, etc.) |
| is_verified | BOOLEAN | défaut: false | Si l'email est vérifié |
| verification_code | VARCHAR(6) | NULL | Code OTP de vérification |
| verification_code_expires_at | DATETIME | NULL | Expiration du code de vérification |
| verification_attempts | INT | défaut: 0 | Nombre de tentatives de vérification |
| device | VARCHAR(100) | défaut: 'unknown' | Type d'appareil |
| password_reset_code | VARCHAR(6) | NULL | Code OTP réinitialisation |
| password_reset_code_expires_at | DATETIME | NULL | Expiration du code réinitialisation |
| password_reset_attempts | INT | défaut: 0 | Tentatives de réinitialisation |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 2. **posts**
Table pour les publications (posts, photos, prédications, annonces, sondages, quiz).

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| author_id | INT | NOT NULL, FK → users.id | Auteur du post |
| content | TEXT | NULL | Contenu textuel |
| media_path | VARCHAR(255) | NULL | Chemin du fichier média |
| mime_type | VARCHAR(150) | NULL | Type MIME du média |
| type | ENUM | 'post', 'photo', 'predication', 'annonce', 'sondage', 'quiz' (défaut: 'post') | Type de publication |
| visible_to | ENUM | 'all' (défaut) | Visibilité |
| options | JSON | NULL | Options (pour sondages/quiz) |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 3. **comments**
Table pour les commentaires sur les posts.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| post_id | INT | NOT NULL, FK → posts.id | Post commenté |
| author_id | INT | NOT NULL, FK → users.id | Auteur du commentaire |
| content | TEXT | NOT NULL | Contenu du commentaire |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 4. **likes**
Table pour les likes sur les posts.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| user_id | INT | NOT NULL, FK → users.id | Utilisateur qui like |
| post_id | INT | NOT NULL, FK → posts.id | Post liké |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

**Indice unique:** (user_id, post_id)

---

### 5. **media**
Table pour stocker les fichiers média.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| filename | VARCHAR(255) | NOT NULL | Nom du fichier |
| original_name | VARCHAR(255) | NULL | Nom original du fichier |
| mime_type | VARCHAR(100) | NOT NULL | Type MIME |
| size | INT | NOT NULL | Taille en octets |
| owner_id | INT | NULL, FK → users.id | Propriétaire du fichier |
| data | BLOB (LONG) | NOT NULL | Données binaires du fichier |
| type | VARCHAR(50) | défaut: 'generic' | Type de média (image, video, audio, etc.) |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 6. **stories**
Table pour les stories (contenu temporaire).

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| user_id | INT | NOT NULL, FK → users.id | Créateur de la story |
| content | TEXT | NULL | Contenu textuel |
| media_path | VARCHAR(255) | NULL | Chemin du média |
| media_type | VARCHAR(100) | NULL | Type MIME |
| expires_at | DATETIME | NULL | Date d'expiration |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 7. **story_views**
Table pour tracker les visualisations de stories.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| story_id | INT | NOT NULL, FK → stories.id | Story visualisée |
| user_id | INT | NOT NULL, FK → users.id | Utilisateur qui visualise |
| viewed_at | DATETIME | défaut: NOW() | Date de visualisation |

---

### 8. **messages**
Table pour les messages directs et les messages de groupe.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| group_id | INT | NULL, FK → groups.id | Groupe destinataire (NULL = DM) |
| sender_id | INT | NOT NULL, FK → users.id | Auteur du message |
| receiver_id | INT | NULL, FK → users.id | Destinataire (NULL = message groupe) |
| content | TEXT | NULL | Contenu du message |
| media_path | VARCHAR(255) | NULL | Chemin du média attaché |
| is_read | BOOLEAN | défaut: false | Si le message est lu |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 9. **groups**
Table pour les groupes de discussion.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| name | VARCHAR(100) | NOT NULL | Nom du groupe |
| description | TEXT | NULL | Description |
| avatar_path | VARCHAR(255) | NULL | Chemin de l'avatar du groupe |
| created_by | INT | NOT NULL, FK → users.id | Créateur du groupe |
| type | ENUM | 'cardinal', 'discussion' (défaut: 'discussion') | Type de groupe |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 10. **group_members**
Table pour les membres des groupes.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| group_id | INT | NOT NULL, FK → groups.id | Groupe |
| user_id | INT | NOT NULL, FK → users.id | Utilisateur membre |
| role_in_group | ENUM | 'membre', 'moderateur' (défaut: 'membre') | Rôle dans le groupe |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 11. **poll_votes**
Table pour les votes sur les sondages.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| user_id | INT | NOT NULL, FK → users.id | Votant |
| post_id | INT | NOT NULL, FK → posts.id | Sondage (post) |
| option_index | INT | NOT NULL | Index de l'option choisie |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 12. **quiz_answers**
Table pour les réponses aux quiz.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| user_id | INT | NOT NULL, FK → users.id | Utilisateur |
| post_id | INT | NOT NULL, FK → posts.id | Quiz (post) |
| answer | VARCHAR(255) | NOT NULL | Réponse donnée |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

**Indice unique:** (user_id, post_id)

---

### 13. **notifications**
Table pour les notifications utilisateurs.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| user_id | INT | NOT NULL, FK → users.id | Destinataire |
| type | VARCHAR(50) | NOT NULL | Type de notification |
| message | TEXT | NOT NULL | Contenu |
| payload | JSON | NULL | Données additionnelles |
| is_read | BOOLEAN | défaut: false | Si lue |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 14. **rewards_history**
Table pour l'historique des récompenses.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| user_id | INT | NOT NULL, FK → users.id | Utilisateur récompensé |
| admin_id | INT | NOT NULL, FK → users.id | Admin qui a accordé |
| montant | INT | NOT NULL | Nombre de points |
| motif | TEXT | NOT NULL | Raison de la récompense |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 15. **user_sessions**
Table pour les sessions actives.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | UUID | PRIMARY KEY, UUIDV4 | Identifiant unique |
| user_id | INT | NOT NULL, FK → users.id | Utilisateur |
| device | VARCHAR(100) | NOT NULL | Type d'appareil |
| ip_address | VARCHAR(64) | NULL | Adresse IP |
| user_agent | VARCHAR(500) | NULL | User-Agent du navigateur |
| last_seen_at | DATETIME | NOT NULL, défaut: NOW() | Dernière activité |
| revoked_at | DATETIME | NULL | Date de révocation |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 16. **moderation_logs**
Table pour les logs de modération.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| user_id | INT | NOT NULL, FK → users.id | Utilisateur visé |
| admin_id | INT | NOT NULL, FK → users.id | Admin modérateur |
| action | VARCHAR(50) | NOT NULL | Action (ban, warn, etc.) |
| reason | VARCHAR(500) | NULL | Raison |
| expires_at | DATETIME | NULL | Expiration de l'action |
| metadata | JSON | NULL | Données additionnelles |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 17. **role_change_logs**
Table pour l'historique des changements de rôle.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| user_id | INT | NOT NULL, FK → users.id | Utilisateur modifié |
| ancien_role | VARCHAR(50) | NULL | Ancien rôle |
| nouveau_role | VARCHAR(50) | NULL | Nouveau rôle |
| ancien_statut | VARCHAR(50) | NULL | Ancien statut |
| nouveau_statut | VARCHAR(50) | NULL | Nouveau statut |
| changed_by | INT | NOT NULL, FK → users.id | Admin qui a modifié |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 18. **audit_logs**
Table pour l'audit de toutes les requêtes API.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| user_id | INT | NULL, FK → users.id | Utilisateur (si autentifié) |
| method | VARCHAR(10) | NOT NULL | Verbe HTTP |
| path | VARCHAR(500) | NOT NULL | Chemin de la route |
| status_code | INT | NOT NULL | Code de réponse HTTP |
| ip_address | VARCHAR(64) | NULL | Adresse IP |
| user_agent | VARCHAR(500) | NULL | User-Agent |
| metadata | JSON | NULL | Données additionnelles |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

### 19. **church_site_configs**
Table pour la configuration du site public.

| Colonne | Type | Propriétés | Description |
|---------|------|-----------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identifiant unique |
| config_key | VARCHAR(80) | UNIQUE, NOT NULL | Clé de configuration |
| content | JSON | NOT NULL | Contenu (données JSON) |
| created_at | DATETIME | Timestamp | Date de création |
| updated_at | DATETIME | Timestamp | Dernière modification |

---

## RELATIONS

```
users (1) ──→ (N) posts
users (1) ──→ (N) comments
users (1) ──→ (N) likes
users (1) ──→ (N) media
users (1) ──→ (N) stories
users (1) ──→ (N) story_views
users (1) ──→ (N) messages
users (1) ──→ (N) groups (created_by)
users (1) ──→ (N) group_members
users (1) ──→ (N) poll_votes
users (1) ──→ (N) quiz_answers
users (1) ──→ (N) notifications
users (1) ──→ (N) rewards_history
users (1) ──→ (N) user_sessions
users (1) ──→ (N) moderation_logs
users (1) ──→ (N) role_change_logs
users (1) ──→ (N) audit_logs

posts (1) ──→ (N) comments
posts (1) ──→ (N) likes
posts (1) ──→ (N) poll_votes
posts (1) ──→ (N) quiz_answers

stories (1) ──→ (N) story_views

groups (1) ──→ (N) group_members
groups (1) ──→ (N) messages

messages (N) ──→ (1) groups
messages (N) ──→ (1) users (sender)
messages (N) ──→ (1) users (receiver)
```

---

## ENUMS

### Rôles utilisateurs (role)
- `peuple` - Rôle par défaut
- `constellation`
- `tornades`
- `tour`
- `batview`

### Statut administratif (status)
- `user` - Utilisateur normal
- `admin` - Administrateur
- `superadmin` - Super administrateur

### Types d'authentification (auth_provider)
- `local` - Authentification par email/mot de passe
- `google` - Authentification via Google OAuth

### Types de publication (post.type)
- `post` - Publication textuelle
- `photo` - Publication avec photo
- `predication` - Prédication
- `annonce` - Annonce
- `sondage` - Sondage
- `quiz` - Quiz

### Types de visibilité (post.visible_to)
- `all` - Visible pour tous

### Types de groupe (group.type)
- `cardinal` - Groupe cardinal
- `discussion` - Groupe de discussion

### Rôles dans les groupes (group_member.role_in_group)
- `membre` - Membre simple
- `moderateur` - Modérateur du groupe

---

## INDEX

Pour optimiser les requêtes, les index suivants sont recommandés:

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Posts
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at);

-- Comments
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- Likes
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);

-- Messages
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Stories
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);

-- Group Members
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Moderation Logs
CREATE INDEX idx_moderation_logs_user_id ON moderation_logs(user_id);
CREATE INDEX idx_moderation_logs_created_at ON moderation_logs(created_at);
```

---

## CONTRAINTES

- Les usernames et emails doivent être uniques
- Les Google IDs doivent être uniques
- Un utilisateur ne peut liker un post qu'une seule fois (unique: user_id, post_id)
- Un utilisateur ne peut répondre qu'une seule fois à un quiz (unique: user_id, post_id)
- Les stories expirent automatiquement selon `expires_at`
- Les sessions peuvent être révoquées via `revoked_at`
- Les blocages temporaires sont définis via `blocked_until`

