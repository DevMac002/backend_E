# Epika Social Backend

Backend Node.js/Express.js pour l'application sociale chrétienne Epika Social, avec Socket.IO, MariaDB via Sequelize, JWT, médias stockés en base et logique métier de rôles/admin.

> **Version corrigée** — Ce document intègre l'ensemble des endpoints et fonctionnalités du cahier des charges complet (commentaires, likes, notifications, cardinal groups, leaderboard Foi, recherche, dashboard admin, etc.) qui manquaient dans la version précédente.

## 1. Présentation

Ce backend fournit :
- Authentification JWT (access + refresh token) avec vérification par OTP email
- Gestion des utilisateurs, rôles et statuts, avec historique des changements
- Feed de posts classique **et** feed "Prédications" séparé (annonces, sondages, quiz, prédications)
- Interactions sociales : likes, commentaires
- Groupes classiques **et** groupes "Cardinaux" (réservés à la gestion admin)
- Messagerie privée et de groupe, avec accusés de lecture
- Système de notifications
- Système de récompenses "Foi" avec historique et classement
- Recherche globale (utilisateurs, posts, groupes)
- Dashboard statistiques pour les admins
- Temps réel via Socket.IO pour messages, notifications, présence, feed, typing indicator
- Stockage des médias en base MariaDB via le modèle `Media` (compression via Sharp)

## 2. Stack technique

- Node.js
- Express.js
- Socket.IO
- Sequelize ORM
- MariaDB (MariaDB Cloud)
- JWT (jsonwebtoken)
- bcrypt
- Multer + Sharp (compression images)
- Helmet / CORS / express-rate-limit
- Joi ou express-validator (validation des inputs)
- Nodemailer (envoi des OTP par email)

## 3. Structure du projet

```text
src/
  config/          -> db.js, jwt.js, socket.js, mailer.js
  controllers/
  middlewares/      -> auth, role, status, ban, upload, validate
  models/
  routes/
  services/
  sockets/
  utils/
postman/
server.js
```

## 4. Prérequis

- Node.js 18+
- Accès à une instance MariaDB Cloud
- Un terminal

## 5. Installation

```bash
cd /Users/esteveabelezechiel/epika-social
npm install
cp .env.example .env
```

Éditer le fichier `.env` :

```env
PORT=3000
NODE_ENV=development

DB_HOST=your_mariadb_cloud_host
DB_PORT=3306
DB_NAME=epika_social
DB_USER=your_user
DB_PASSWORD=your_password
DB_DIALECT=mariadb
DB_SSL=true

JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=noreply@epikasocial.com
MAIL_PASSWORD=your_mail_password

UPLOAD_MAX_SIZE_MB=15
```

## 6. Démarrage

```bash
npm run dev     # développement
npm start        # production
```

Serveur disponible sur `http://localhost:3000`

## 7. Vérification rapide

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "service": "epika-social", "uptime": 123.45, "db": "connected" }
```

---

## 8. Authentification

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/register` | Créer un compte (statut non vérifié) |
| POST | `/auth/send-verification-code` | (Ré)envoyer un OTP par email |
| POST | `/auth/verify-email` | Valider le compte avec le code OTP |
| POST | `/auth/login` | Connexion (refusée si non vérifié ou banni) |
| POST | `/auth/refresh` | Rafraîchir l'access token |
| POST | `/auth/logout` | Déconnexion (invalide le refresh token courant) |
| POST | `/auth/logout-all` | Déconnexion de tous les appareils |
| POST | `/auth/forgot-password` | Demander un OTP de réinitialisation |
| POST | `/auth/reset-password` | Réinitialiser le mot de passe avec l'OTP |
| GET | `/auth/sessions` | Lister les sessions/appareils actifs de l'utilisateur |

### Exemple : inscription

```http
POST /auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "secret123"
}
```

### Exemple : connexion

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "role": "peuple",
    "status": "user",
    "foi_points": 0,
    "avatar_path": null
  }
}
```

---

## 9. Utilisateurs

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/users/me` | Auth | Profil courant |
| PUT | `/users/me` | Auth | Modifier son profil (username, bio) |
| POST | `/users/me/avatar` | Auth | Upload/remplacement de l'avatar (local) |
| DELETE | `/users/me` | Auth | Désactiver / supprimer son propre compte |
| GET | `/users/:id` | Auth | Voir un profil public |
| GET | `/users` | Admin/SuperAdmin | Lister/rechercher les utilisateurs (filtres: role, status, banni, texte) |
| PUT | `/users/:id/role` | Admin/SuperAdmin | Modifier le rôle (peuple/constellation/tornades/tour/batview) |
| PUT | `/users/:id/status` | SuperAdmin uniquement | Modifier le statut (user/admin/superadmin) |
| PUT | `/users/:id/ban` | Admin/SuperAdmin | Bannir / débannir |
| POST | `/users/:id/reward` | Admin/SuperAdmin | Attribuer des points Foi |
| GET | `/users/:id/rewards` | Auth | Historique des récompenses reçues par un utilisateur |
| GET | `/users/leaderboard/foi` | Auth | Classement des utilisateurs par points Foi |
| GET | `/users/logs/roles` | SuperAdmin uniquement | Historique complet des changements de rôle/statut |

### Exemple : recherche/filtrage des utilisateurs (admin)

```http
GET /users?role=constellation&status=user&search=john&page=1&limit=20
Authorization: Bearer <accessToken>
```

### Exemple : classement Foi

```http
GET /users/leaderboard/foi?limit=10
Authorization: Bearer <accessToken>
```

```json
{
  "leaderboard": [
    { "id": 4, "username": "marie", "foi_points": 320, "avatar_path": "/media/xxx.jpg" },
    { "id": 1, "username": "john", "foi_points": 210, "avatar_path": null }
  ]
}
```

---

## 10. Posts (Feed classique + Feed Prédications)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/posts` | Auth | Feed classique (type=post uniquement), pagination |
| GET | `/posts/predications` | Auth | Feed séparé : annonces, sondages, quiz, prédications (lecture pour tous, création admin/superadmin) |
| GET | `/posts/:id` | Auth | Détail d'un post |
| POST | `/posts` | Auth (types spéciaux réservés admin/superadmin) | Créer un post |
| PUT | `/posts/:id` | Auteur ou Admin/SuperAdmin | Modifier un post |
| DELETE | `/posts/:id` | Auteur ou Admin/SuperAdmin | Supprimer un post |
| POST | `/posts/:id/like` | Auth | Liker un post |
| DELETE | `/posts/:id/like` | Auth | Retirer son like |
| GET | `/posts/:id/likes` | Auth | Liste des utilisateurs ayant liké |
| GET | `/posts/:id/comments` | Auth | Lister les commentaires (pagination) |
| POST | `/posts/:id/comments` | Auth | Ajouter un commentaire |
| DELETE | `/posts/:id/comments/:commentId` | Auteur du commentaire ou Admin | Supprimer un commentaire |
| POST | `/posts/:id/vote` | Auth | Voter sur un sondage |
| GET | `/posts/:id/results` | Auth | Résultats d'un sondage en temps réel |
| POST | `/posts/:id/answer` | Auth | Répondre à un quiz |
| GET | `/posts/:id/quiz-results` | Auth | Classement / bonnes réponses d'un quiz |

### Exemple : créer un post classique

```http
POST /posts
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: <fichier>
content: "Bonjour à tous"
type: "post"
```

### Exemple : créer une annonce (réservé admin/superadmin)

```http
POST /posts
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: <fichier>
content: "Culte spécial ce dimanche"
type: "annonce"
```

### Exemple : créer un sondage

```json
{
  "content": "Quel thème pour le prochain culte ?",
  "type": "sondage",
  "options": ["Louange", "Enseignement", "Témoignages"],
  "date_limite": "2026-07-20T00:00:00Z"
}
```

### Exemple : commentaire

```http
POST /posts/12/comments
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "content": "Amen, merci pour ce partage 🙏" }
```

---

## 11. Groupes (classiques + Cardinaux)

Deux types de groupes existent (`type`: `cardinal` ou `discussion`). Les **groupes cardinaux** sont des groupes de discussion structurants, dont la création/gestion est réservée aux admin/superadmin ; les **groupes classiques** peuvent être créés par tout utilisateur.

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/groups` | Auth | Lister les groupes dont l'utilisateur est membre |
| GET | `/groups/discover` | Auth | Découvrir les groupes publics existants |
| GET | `/groups/:id` | Membre | Détail d'un groupe |
| POST | `/groups` | Auth (type=cardinal réservé admin/superadmin) | Créer un groupe |
| PUT | `/groups/:id` | Créateur ou Admin | Modifier un groupe (nom, description) |
| POST | `/groups/:id/avatar` | Créateur ou Admin | Upload avatar du groupe |
| DELETE | `/groups/:id` | Créateur ou Admin/SuperAdmin | Supprimer un groupe |
| GET | `/groups/:id/members` | Membre | Lister les membres |
| POST | `/groups/:id/members` | Admin du groupe ou Admin/SuperAdmin | Ajouter un membre |
| DELETE | `/groups/:id/members/:userId` | Admin du groupe ou Admin/SuperAdmin | Retirer un membre |
| POST | `/groups/:id/leave` | Membre | Quitter le groupe |
| PUT | `/groups/:id/members/:userId/role` | Créateur ou Admin | Modifier le rôle dans le groupe (membre/modérateur) |

---

## 12. Messages

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/messages/conversations` | Auth | Lister toutes les conversations (privées + groupes) avec dernier message |
| GET | `/messages/:conversationId` | Membre | Historique des messages d'une conversation, pagination |
| POST | `/messages` | Auth | Envoyer un message (fallback REST, en plus du socket) |
| PUT | `/messages/:id/read` | Destinataire | Marquer comme lu |
| PUT | `/messages/conversations/:conversationId/read-all` | Membre | Marquer toute la conversation comme lue |
| DELETE | `/messages/:id` | Auteur | Supprimer un message (pour soi ou pour tous) |
| GET | `/messages/unread-count` | Auth | Nombre total de messages non lus |

### Exemple : envoyer un message avec média

```http
POST /messages
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

conversationId: 5
content: "Voici la photo"
file: <fichier>
```

---

## 13. Notifications

| Méthode | Route | Description |
|---|---|---|
| GET | `/notifications` | Lister les notifications (pagination, filtre lu/non lu) |
| PUT | `/notifications/:id/read` | Marquer une notification comme lue |
| PUT | `/notifications/read-all` | Tout marquer comme lu |
| DELETE | `/notifications/:id` | Supprimer une notification |
| GET | `/notifications/unread-count` | Nombre de notifications non lues |

Types de notifications générées automatiquement : nouveau like, nouveau commentaire, nouveau message, changement de rôle/statut, récompense Foi reçue, ajout à un groupe, nouvelle prédication/annonce.

---

## 14. Recherche

| Méthode | Route | Description |
|---|---|---|
| GET | `/search?q=texte` | Recherche globale (utilisateurs, posts, groupes) |
| GET | `/search/users?q=texte` | Recherche utilisateurs uniquement |
| GET | `/search/groups?q=texte` | Recherche groupes uniquement |

---

## 15. Dashboard Admin

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin/SuperAdmin | Statistiques globales (nb utilisateurs, posts, groupes, messages, actifs du jour) |
| GET | `/admin/stats/growth` | Admin/SuperAdmin | Évolution des inscriptions sur une période |
| GET | `/admin/logs` | SuperAdmin | Journal complet des actions sensibles (ban, rôle, statut, suppression) |

### Exemple : réponse `/admin/stats`

```json
{
  "total_users": 482,
  "total_posts": 1290,
  "total_groups": 34,
  "active_today": 76,
  "banned_users": 3,
  "posts_by_type": { "post": 1100, "annonce": 40, "sondage": 90, "quiz": 30, "predication": 30 }
}
```

---

## 16. Médias

| Méthode | Route | Description |
|---|---|---|
| GET | `/media/:filename` | Servir un fichier local |
| DELETE | `/media/:filename` | Supprimer un fichier (auteur ou admin uniquement) |

Les fichiers sont compressés via Sharp avant écriture disque, renommés aléatoirement, et leur type MIME réel est vérifié (pas seulement l'extension).

---

## 17. Socket.IO

### Authentification au handshake

```javascript
const socket = io(URL, { auth: { token: accessToken } });
```

### Événements disponibles

| Événement | Sens | Description |
|---|---|---|
| `message:send` | client → serveur | Envoyer un message |
| `message:receive` | serveur → client | Nouveau message reçu |
| `message:read` | serveur → client | Accusé de lecture |
| `typing:start` / `typing:stop` | bidirectionnel | Indicateur "en train d'écrire" |
| `presence:online` / `presence:offline` | serveur → client | Présence des utilisateurs |
| `post:new` | serveur → client | Nouveau post publié dans le feed |
| `post:predication_new` | serveur → client | Nouvelle annonce/sondage/quiz/prédication |
| `poll:vote_update` | serveur → client | Mise à jour live des résultats de sondage |
| `notification:new` | serveur → client | Nouvelle notification |
| `user:role_updated` | serveur → client | Rôle/statut modifié (à l'utilisateur concerné) |
| `user:banned` | serveur → client | Déconnexion forcée d'un utilisateur banni |
| `reward:received` | serveur → client | Réception de points Foi |

---

## 18. Règles métier importantes

- Seuls les utilisateurs avec statut `admin` ou `superadmin` peuvent créer des posts de type `annonce`, `sondage`, `quiz`, `predication`.
- Seuls les `superadmin` peuvent modifier les statuts et créer/gérer les groupes cardinaux au niveau supérieur ; un `admin` ne peut ni créer un autre admin ni toucher à un superadmin.
- Un utilisateur banni ne peut ni se connecter, ni faire d'action protégée ; il est également déconnecté en temps réel du socket (`user:banned`).
- Tous les changements de rôle/statut sont enregistrés dans `role_change_logs`, consultables via `/users/logs/roles`.
- Toute suppression (post, commentaire, message, groupe) est une suppression logique (soft delete) pour conserver la traçabilité, sauf suppression définitive explicite par un superadmin.
- Les routes sensibles (login, register, reward, création de post) sont protégées par rate limiting.
- Les récompenses Foi remplacent le système de followers : aucun endpoint `follow`/`unfollow` n'existe dans ce projet.

---

## 19. Tests Postman

Deux collections sont disponibles dans [postman](postman) :
- [postman/epika-social-full-api.postman_collection.json](postman/epika-social-full-api.postman_collection.json) — collection complète
- [postman/epika-social-auth-otp.postman_collection.json](postman/epika-social-auth-otp.postman_collection.json) — flux d'authentification OTP uniquement

### Ordre recommandé pour tester le flux complet

1. Health
2. Register
3. Send Verification Code
4. Verify Email
5. Login
6. Get My Profile
7. Create Post (classique)
8. Like + Comment sur le post
9. Create Post (annonce — avec un compte admin)
10. Vote sur un sondage
11. Create Group (classique et cardinal)
12. Add Member to Group
13. Send Message (REST) + tester via Socket.IO
14. Reward un utilisateur + vérifier `/users/:id/rewards`
15. Get Admin Stats
16. Search global

Variables de collection prévues : `baseUrl`, `accessToken`, `refreshToken`, `userId`, `postId`, `groupId`, `conversationId`.

---

## 20. Dépannage

### Erreur de connexion à MariaDB Cloud
- Vérifier `.env` (host, port, SSL activé si requis par le fournisseur)
- Vérifier que l'IP du serveur est autorisée dans le firewall de MariaDB Cloud
- Vérifier le nom de la base et les credentials

### Erreur 401 / 403
- Vérifier le token JWT et son expiration
- Vérifier que l'utilisateur n'est pas banni
- Vérifier que le statut/rôle correspond bien à la permission requise sur la route

### Fichiers non servis
- Vérifier que la table `media` existe et que la connexion MariaDB est disponible
- Vérifier que le fichier a bien été téléchargé et n'a pas été supprimé via `/media/:filename`

### Socket.IO ne se connecte pas
- Vérifier que le token est bien passé dans `auth.token` au handshake
- Vérifier CORS côté serveur pour l'origine du client mobile/web

---

## 21. Notes

Ce backend est pensé pour évoluer facilement vers un front-end mobile (Flutter/React Native). Les couches sont séparées en routes, contrôleurs, services, modèles et middlewares pour faciliter la maintenance. Toute nouvelle fonctionnalité doit respecter la séparation admin/superadmin/user au niveau du middleware, jamais uniquement côté client.
