# Epika Social — Backend API

Base URL de l'API : `http://localhost:3000`

Toutes les routes protégées requièrent l'en-tête :

```http
Authorization: Bearer <accessToken>
```

## Points clés

- Authentification JWT via `/auth/login`
- Envois de fichiers avec `multipart/form-data`
- Routes principales : `/auth`, `/users`, `/posts`, `/stories`, `/groups`, `/messages`, `/notifications`

## Auth

### Vérifier que le serveur est actif

```bash
curl http://localhost:3000/health
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "timestamp": "2026-08-13T12:00:00.000Z"
}
```

### Inscription

L'inscription envoie automatiquement un code OTP par email. Si le compte existe déjà mais n'est pas vérifié, relancer cette même requête renverra un nouveau code (limite de 5 tentatives).

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"newuser","email":"user@example.com","password":"Password123\\!","device":"flutter"}'
```

**Réponse attendue (201 Created) :**
```json
{
  "success": true,
  "message": "Inscription effectuée. Vérifiez votre email avec le code envoyé.",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "is_verified": false
  }
}
```

### Vérifier l'email (OTP)

Valider le compte et obtenir directement les tokens d'accès :

```bash
curl -X POST http://localhost:3000/auth/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","code":"123456"}'
```

**Réponse attendue (200 OK) :**
```json
{
  "message": "Email vérifié avec succès. Bienvenue !",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "role": "peuple",
    "status": "user",
    "is_verified": true
  }
}
```

### Renvoyer le code de vérification (manuel)

Si l'utilisateur a besoin d'un nouveau code sans repasser par `/register` :

```bash
curl -X POST http://localhost:3000/auth/send-verification-code \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com"}'
```

**Réponse attendue (200 OK) :**
```json
{
  "message": "Code envoyé"
}
```

### Connexion

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Password123\\!","device":"flutter"}'
```

**Réponse attendue (200 OK) :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": { 
    "id": 1, 
    "username": "newuser",
    "email": "user@example.com",
    "role": "peuple",
    "status": "user",
    "is_verified": true,
    "device": "flutter"
  }
}
```

### Rafraîchir le token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
```

**Réponse attendue (200 OK) :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

### Déconnexion

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
```

**Réponse attendue (200 OK) :**
```json
{
  "message": "Déconnecté"
}
```

## Utilisateur connecté

### Récupérer le profil

```bash
curl http://localhost:3000/users/me \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
{
  "id": 1,
  "username": "newuser",
  "email": "user@example.com",
  "bio": null,
  "avatar_path": null,
  "role": "peuple",
  "status": "user",
  "foi_points": 0,
  "is_verified": true
}
```

### Mettre à jour le profil

```bash
curl -X PUT http://localhost:3000/users/me \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"username":"nouveau","bio":"Bio Flutter"}'
```

**Réponse attendue (200 OK) :**
```json
{
  "message": "Profil mis à jour",
  "user": {
    "id": 1,
    "username": "nouveau",
    "bio": "Bio Flutter"
  }
}
```

## Publications

### Lister le feed

```bash
curl http://localhost:3000/posts?page=1&limit=20 \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
{
  "data": [
    {
      "id": 1,
      "content": "Bonjour depuis Flutter",
      "type": "text",
      "createdAt": "2026-08-13T12:00:00.000Z",
      "author": {
        "id": 1,
        "username": "nouveau",
        "avatar_path": null
      },
      "likesCount": 0,
      "commentsCount": 0
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Créer une publication (post, photo, quiz, etc.)

```bash
curl -X POST http://localhost:3000/posts \
  -H 'Authorization: Bearer <accessToken>' \
  -F 'content=Bonjour depuis Flutter' \
  -F 'type=text'
```

**Réponse attendue (201 Created) :**
```json
{
  "message": "Publication créée avec succès",
  "post": {
    "id": 1,
    "content": "Bonjour depuis Flutter",
    "type": "text",
    "user_id": 1,
    "createdAt": "2026-08-13T12:00:00.000Z"
  }
}
```

Avec fichier média :

```bash
curl -X POST http://localhost:3000/posts \
  -H 'Authorization: Bearer <accessToken>' \
  -F 'content=Photo from Flutter' \
  -F 'type=photo' \
  -F 'file=@/path/to/photo.jpg'
```

**Réponse attendue (201 Created) :**
```json
{
  "message": "Publication créée avec succès",
  "post": {
    "id": 2,
    "content": "Photo from Flutter",
    "type": "photo",
    "user_id": 1,
    "media": [
      {
        "id": 1,
        "url": "/uploads/posts/photo-123.jpg",
        "type": "image"
      }
    ]
  }
}
```

### Consulter une publication

```bash
curl http://localhost:3000/posts/1 \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
{
  "id": 1,
  "content": "Bonjour depuis Flutter",
  "type": "text",
  "author": {
    "id": 1,
    "username": "nouveau"
  },
  "comments": []
}
```

### Ajouter un commentaire

```bash
curl -X POST http://localhost:3000/posts/1/comments \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"content":"Super post \\!"}'
```

**Réponse attendue (201 Created) :**
```json
{
  "message": "Commentaire ajouté",
  "comment": {
    "id": 1,
    "content": "Super post !",
    "post_id": 1,
    "user_id": 1,
    "createdAt": "2026-08-13T12:05:00.000Z"
  }
}
```

## Stories

### Lister les stories

```bash
curl http://localhost:3000/stories?page=1&limit=20 \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
{
  "data": [
    {
      "id": 1,
      "type": "text",
      "content": "Bonne journée !",
      "createdAt": "2026-08-13T12:00:00.000Z",
      "author": {
        "id": 1,
        "username": "nouveau"
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### Créer une story texte

```bash
curl -X POST http://localhost:3000/stories \
  -H 'Authorization: Bearer <accessToken>' \
  -F 'type=text' \
  -F 'content=Bonne journée \!'
```

**Réponse attendue (201 Created) :**
```json
{
  "message": "Story créée",
  "story": {
    "id": 1,
    "type": "text",
    "content": "Bonne journée !",
    "user_id": 1,
    "expires_at": "2026-08-14T12:00:00.000Z"
  }
}
```

### Créer une story média

```bash
curl -X POST http://localhost:3000/stories \
  -H 'Authorization: Bearer <accessToken>' \
  -F 'type=image' \
  -F 'content=Une image depuis Flutter' \
  -F 'media=@/path/to/image.jpg'
```

**Réponse attendue (201 Created) :**
```json
{
  "message": "Story créée",
  "story": {
    "id": 2,
    "type": "image",
    "content": "Une image depuis Flutter",
    "media_url": "/uploads/stories/image-123.jpg",
    "user_id": 1
  }
}
```

### Consulter une story

```bash
curl http://localhost:3000/stories/1 \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
{
  "id": 1,
  "type": "text",
  "content": "Bonne journée !",
  "author": {
    "id": 1,
    "username": "nouveau"
  }
}
```

### Marquer une story comme vue

```bash
curl -X POST http://localhost:3000/stories/1/view \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
{
  "message": "Story vue"
}
```

### Voir les viewers d'une story

```bash
curl http://localhost:3000/stories/1/viewers \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
[
  {
    "id": 2,
    "username": "autre_utilisateur",
    "avatar_path": null,
    "viewed_at": "2026-08-13T12:10:00.000Z"
  }
]
```

## Groupes

### Lister les groupes

```bash
curl http://localhost:3000/groups?page=1&limit=20 \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Mon groupe",
      "description": "Groupe Flutter",
      "membersCount": 1
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### Créer un groupe

```bash
curl -X POST http://localhost:3000/groups \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mon groupe","description":"Groupe Flutter"}'
```

**Réponse attendue (201 Created) :**
```json
{
  "message": "Groupe créé",
  "group": {
    "id": 1,
    "name": "Mon groupe",
    "description": "Groupe Flutter",
    "creator_id": 1
  }
}
```

## Messagerie

### Envoyer un message privé

```bash
curl -X POST http://localhost:3000/messages \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"content":"Salut \\!","receiver_id":2}'
```

**Réponse attendue (201 Created) :**
```json
{
  "message": "Message envoyé",
  "data": {
    "id": 1,
    "content": "Salut !",
    "sender_id": 1,
    "receiver_id": 2,
    "createdAt": "2026-08-13T12:00:00.000Z"
  }
}
```

### Lister les conversations

```bash
curl http://localhost:3000/messages/conversations \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
[
  {
    "contact": {
      "id": 2,
      "username": "autre_utilisateur"
    },
    "lastMessage": {
      "id": 1,
      "content": "Salut !",
      "createdAt": "2026-08-13T12:00:00.000Z"
    },
    "unreadCount": 0
  }
]
```

## Notifications

### Lister les notifications

```bash
curl http://localhost:3000/notifications \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
{
  "data": [
    {
      "id": 1,
      "type": "NEW_FOLLOWER",
      "content": "Un utilisateur a commencé à vous suivre.",
      "is_read": false,
      "createdAt": "2026-08-13T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### Marquer une notification comme lue

```bash
curl -X PUT http://localhost:3000/notifications/1/read \
  -H 'Authorization: Bearer <accessToken>'
```

**Réponse attendue (200 OK) :**
```json
{
  "message": "Notification marquée comme lue"
}
```

## Exemple Flutter

Pour Flutter, utiliser `http.MultipartRequest` pour les endpoints `POST /posts` et `POST /stories` avec fichiers.

- Auth : `POST /auth/login`
- Créer une publication : `POST /posts` avec `content`, `type`, et `file`
- Créer une story : `POST /stories` avec `type`, `content`, et `media`
- Récupérer le feed : `GET /posts`, `GET /stories`
- Protéger les requêtes avec `Authorization: Bearer <token>`
