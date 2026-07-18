# Epika Social Backend

Backend Node.js/Express.js pour l’application sociale chrétienne Epika Social, avec MariaDB via Sequelize, JWT, stockage des médias en base de données et architecture compatible Vercel serverless.

## 1. Présentation

Ce backend fournit :
- Authentification JWT (access + refresh token)
- Gestion des utilisateurs, rôles et statuts
- Feed de posts avec types spéciaux (post, predication, annonce, sondage, quiz)
- Groupes et messages
- Stockage média en base de données (BLOB) au lieu du disque local
- Architecture compatible Vercel serverless
- Option realtime via Pusher

## 2. Stack technique

- Node.js
- Express.js
- Sequelize ORM
- MariaDB
- JWT
- bcrypt
- Multer
- Sharp
- Helmet / CORS / express-rate-limit
- Pusher (optionnel)

## 3. Structure du projet

```text
api/
  index.js
src/
  config/
  controllers/
  middlewares/
  models/
  routes/
  services/
  utils/
server.js
vercel.json
```

## 4. Prérequis

- Node.js 18+
- MariaDB accessible
- Accès à un terminal
- Compte Vercel pour déploiement serverless

## 5. Installation

```bash
cd /Users/esteveabelezechiel/epika-social
npm install
cp .env.example .env
```

Éditer le fichier `.env` avec vos valeurs MariaDB, JWT, SMTP et Pusher :

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=epika_social
DB_USER=root
DB_PASSWORD=your_password
DB_DIALECT=mariadb
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@example.com
SMTP_PASS=your_smtp_password
SMTP_FROM=you@example.com

PUSHER_ENABLED=false
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
```

## 6. Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production local
```bash
npm start
```

### Migration de la base de données

En production, lancez la migration avant le démarrage (Render l’exécute maintenant automatiquement) :

```bash
npm run db:migrate
```

Elle crée notamment `audit_logs`, indispensable à la page publique `/logs`.

Le serveur démarre ensuite sur :
```text
http://localhost:3000
```

### Déploiement sur Vercel

Le projet est prêt pour Vercel grâce à `vercel.json` et à l’entrée `api/index.js`.

```bash
vercel --prod
```

L’URL de base devient :
```text
https://<votre-projet>.vercel.app
```

## 7. Vérification rapide

```bash
curl https://<votre-projet>.vercel.app/health
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

Les fichiers téléchargés sont stockés en base de données et accessibles via :
```http
GET /media/:id
```

#### Supprimer un média
```http
DELETE /media/:id
Authorization: Bearer <accessToken>
```

## 10. Temps réel serverless

Le backend est compatible Vercel et peut utiliser Pusher pour les événements realtime lorsque `PUSHER_ENABLED=true`.

### Événements disponibles (Pusher)

- `message:receive`
- `notification:new`
- `user:role_updated`
- `user:status_updated`
- `user:ban_updated`
- `group:member_added`

### Remarque frontend

Si vous passez à Pusher, le frontend Flutter doit écouter les canaux Pusher au lieu de Socket.IO.

## 11. Variables d’environnement Vercel

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_DIALECT`
- `DB_SSL`
- `DB_SSL_REJECT_UNAUTHORIZED`
- `DB_POOL_MAX`
- `DB_POOL_MIN`
- `DB_POOL_ACQUIRE`
- `DB_POOL_IDLE`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `PUSHER_ENABLED`
- `PUSHER_APP_ID`
- `PUSHER_KEY`
- `PUSHER_SECRET`
- `PUSHER_CLUSTER`

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
- Vérifier que le dossier `uploads/` existe localement (pour le développement)
- Si vous êtes en production Vercel, vérifier la route `GET /media/:id`

## 14. Notes

Ce backend est pensé pour évoluer facilement vers un front-end mobile/web. Les couches sont séparées en routes, contrôleurs, services, modèles et middlewares pour faciliter la maintenance.
