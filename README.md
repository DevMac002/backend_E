# Epika Social Backend

Backend Node.js/Express.js pour l’application sociale chrétienne Epika Social, avec Socket.IO, MariaDB via Sequelize, JWT, uploads locaux et logique métier de rôles/admin.

## 1. Présentation

Ce backend fournit :
- Authentification JWT (access + refresh token)
- Gestion des utilisateurs, rôles et statuts
- Feed de posts avec types spéciaux (post, predication, annonce, sondage, quiz)
- Groupes et messages
- Temps réel via Socket.IO pour messages, notifications, présence et feed
- Stockage local des médias dans le dossier uploads

## 2. Stack technique

- Node.js
- Express.js
- Socket.IO
- Sequelize ORM
- MariaDB
- JWT
- bcrypt
- Multer
- Sharp
- Helmet / CORS / express-rate-limit

## 3. Structure du projet

```text
src/
  config/
  controllers/
  middlewares/
  models/
  routes/
  services/
  sockets/
  utils/
server.js
```

## 4. Prérequis

- Node.js 18+
- MariaDB installé ou accessible
- Accès à un terminal

## 5. Installation

```bash
cd /Users/esteveabelezechiel/epika-social
npm install
cp .env.example .env
```

Éditer le fichier `.env` avec vos valeurs MariaDB et JWT :

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=epika_social
DB_USER=root
DB_PASSWORD=your_password
DB_DIALECT=mariadb

JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## 6. Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre ensuite sur :
```text
http://localhost:3000
```

## 7. Vérification rapide

```bash
curl http://localhost:3000/health
```

Réponse attendue :
```json
{ "status": "ok", "service": "epika-social" }
```

## 8. Authentification

### Enregistrer un utilisateur
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "secret123"
}
```

Réponse attendue : le compte est créé en attente de vérification et un code OTP est envoyé par email.

### Envoyer un code de vérification
```http
POST /auth/send-verification-code
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Vérifier l’email avec le code OTP
```http
POST /auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

### Se connecter
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secret123"
}
```

Un compte non vérifié ne peut pas se connecter.

Réponse :
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "role": "peuple",
    "status": "user"
  }
}
```

### Rafraîchir le token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

### Déconnexion
```http
POST /auth/logout
```

## 9. Utilisation des endpoints

### Utilisateurs

#### Récupérer son profil
```http
GET /users/me
Authorization: Bearer <accessToken>
```

#### Mettre à jour son profil
```http
PUT /users/me
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "username": "newname",
  "bio": "Bonjour"
}
```

#### Voir un profil public
```http
GET /users/:id
Authorization: Bearer <accessToken>
```

#### Changer le rôle d’un utilisateur
```http
PUT /users/:id/role
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "role": "constellation"
}
```

#### Changer le statut d’un utilisateur
```http
PUT /users/:id/status
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "admin"
}
```

#### Bannir / débannir un utilisateur
```http
PUT /users/:id/ban
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "ban": true
}
```

#### Attribuer des points Foi
```http
POST /users/:id/reward
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "montant": 10,
  "motif": "Participation active"
}
```

### Posts

#### Lister les posts
```http
GET /posts
Authorization: Bearer <accessToken>
```

#### Créer un post
```http
POST /posts
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: <fichier>
content: "Bonjour"
type: "post"
```

#### Créer un post sensible (admin only)
```http
POST /posts
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

file: <fichier>
content: "Annonce"
type: "annonce"
```

#### Voter sur un sondage
```http
POST /posts/:id/vote
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "option_index": 0
}
```

#### Répondre à un quiz
```http
POST /posts/:id/answer
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "answer": "A"
}
```

### Groupes

#### Lister les groupes
```http
GET /groups
Authorization: Bearer <accessToken>
```

#### Créer un groupe
```http
POST /groups
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "nom": "Groupe de prière",
  "description": "Discussion hebdomadaire"
}
```

#### Ajouter un membre
```http
POST /groups/:id/members
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "user_id": 2,
  "role_in_group": "membre"
}
```

### Messages

#### Récupérer les messages d’une conversation
```http
GET /messages/:conversationId
Authorization: Bearer <accessToken>
```

### Médias

Les fichiers téléchargés sont stockés localement dans le dossier `uploads/` et accessibles via :
```http
GET /media/<filename>
```

## 10. Socket.IO

Le backend expose des événements temps réel.

### Authentification au handshake
Envoyer le token JWT dans `auth.token`.

### Événements disponibles

#### Envoyer un message
```javascript
socket.emit('message:send', { conversationId: 1, content: 'Salut' })
```

#### Recevoir un message
```javascript
socket.on('message:receive', (payload) => {
  console.log(payload)
})
```

#### Présence
```javascript
socket.on('presence:online', (payload) => {})
socket.on('presence:offline', (payload) => {})
```

#### Nouveau post
```javascript
socket.on('post:new', (payload) => {})
```

#### Nouvelle notification
```javascript
socket.on('notification:new', (payload) => {})
```

#### Mise à jour d’un sondage
```javascript
socket.on('poll:vote_update', (payload) => {})
```

## 11. Règles métier importantes

- Seuls les utilisateurs avec statut `admin` ou `superadmin` peuvent créer des posts de type annonce, sondage, quiz, predication.
- Seuls les `superadmin` peuvent gérer les statuts.
- Un utilisateur banni ne peut ni se connecter ni faire d’action protégée.
- Les changements de rôle/statut sont enregistrés dans `role_change_logs`.
- Les routes sensibles sont protégées par rate limiting.

## 12. Tests Postman

Deux collections Postman sont disponibles dans le dossier [postman](postman) pour tester rapidement l’API.

Importez le fichier principal :
- [postman/epika-social-full-api.postman_collection.json](postman/epika-social-full-api.postman_collection.json)

Vous pouvez également utiliser la collection plus légère dédiée à l’authentification OTP :
- [postman/epika-social-auth-otp.postman_collection.json](postman/epika-social-auth-otp.postman_collection.json)

Ordre recommandé des appels pour le flux complet :
1. Health
2. Register
3. Send Verification Code
4. Verify Email
5. Login
6. Get My Profile
7. Create Post
8. List Groups
9. Create Message

Les variables de collection suivantes sont prévues :
- baseUrl : URL de base de votre serveur
- accessToken : token JWT injecté après login
- refreshToken : refresh token injecté après login

## 13. Dépannage

### Erreur de connexion à MariaDB
- Vérifier `.env`
- Vérifier que MariaDB tourne bien
- Vérifier le nom de la base et les credentials

### Erreur 401 / 403
- Vérifier le token JWT
- Vérifier que l’utilisateur n’est pas banni

### Fichiers non servis
- Vérifier que le dossier `uploads/` existe
- Vérifier que le fichier a bien été téléchargé

## 14. Notes

Ce backend est pensé pour évoluer facilement vers un front-end mobile/web. Les couches sont séparées en routes, contrôleurs, services, modèles et middlewares pour faciliter la maintenance.
