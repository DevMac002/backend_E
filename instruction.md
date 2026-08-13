# Epika Social — Guide API pour Flutter

Base URL de l'API :

```text
http://localhost:3000
```

Toujours envoyer le token sur les routes protégées :

```http
Authorization: Bearer <accessToken>
```

## 1. Conventions générales

- Les routes publiques ou semi-protégées utilisent JSON pour les payloads.
- Les routes avec fichiers utilisent `multipart/form-data`.
- Les réponses paginées suivent en général ce format :

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

- Les erreurs renvoient généralement :

```json
{
  "message": "Description de l'erreur"
}
```

- Les champs de date sont renvoyés au format ISO 8601 :

```text
2026-08-13T12:00:00.000Z
```

---

## 2. Authentification

### 2.1. Vérifier le serveur

```http
GET /health
```

Réponse attendue :

```json
{
  "status": "ok",
  "service": "epika-social"
}
```

### 2.2. Inscription

Endpoint :

```http
POST /auth/register
Content-Type: application/json
```

Entrée :

```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "Password123!",
  "device": "flutter"
}
```

Sortie attendue :

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

Notes Flutter :
- Enregistrer le `username`, `email`, `password` dans l’état local si nécessaire.
- Le compte n'est pas immédiatement actif tant qu'il n'a pas validé le code OTP.

### 2.3. Renvoyer le code de vérification

```http
POST /auth/send-verification-code
Content-Type: application/json
```

Entrée :

```json
{
  "email": "user@example.com"
}
```

Sortie :

```json
{
  "message": "Code envoyé"
}
```

### 2.4. Vérifier l’email avec OTP

```http
POST /auth/verify-email
Content-Type: application/json
```

Entrée :

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

Sortie :

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

### 2.5. Connexion email / mot de passe

```http
POST /auth/login
Content-Type: application/json
```

Entrée :

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "device": "flutter"
}
```

Sortie :

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

### 2.6. Connexion Google Sign-In

```http
POST /auth/google
Content-Type: application/json
```

Entrée :

```json
{
  "credential": "<google_id_token>",
  "device": "flutter"
}
```

Sortie :

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@gmail.com",
    "role": "peuple",
    "status": "user",
    "is_verified": true,
    "device": "flutter",
    "auth_provider": "google"
  }
}
```

### 2.7. Rafraîchir le token

```http
POST /auth/refresh
Content-Type: application/json
```

Entrée :

```json
{
  "refreshToken": "<refreshToken>"
}
```

Sortie :

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

### 2.8. Déconnexion

```http
POST /auth/logout
Content-Type: application/json
```

Entrée :

```json
{
  "refreshToken": "<refreshToken>"
}
```

Sortie :

```json
{
  "message": "Déconnecté"
}
```

---

## 3. Utilisateur

### 3.1. Récupérer le profil courant

```http
GET /users/me
Authorization: Bearer <accessToken>
```

Sortie :

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
  "is_verified": true,
  "device": "flutter"
}
```

### 3.2. Mettre à jour le profil

```http
PUT /users/me
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Entrée :

```json
{
  "username": "nouveau",
  "bio": "Bio Flutter"
}
```

Sortie :

```json
{
  "id": 1,
  "username": "nouveau",
  "email": "user@example.com",
  "bio": "Bio Flutter",
  "avatar_path": null,
  "role": "peuple",
  "status": "user"
}
```

### 3.3. Lister les utilisateurs

```http
GET /users?page=1&limit=20
Authorization: Bearer <accessToken>
```

Sortie :

```json
{
  "data": [
    {
      "id": 1,
      "username": "alice",
      "email": "alice@example.com",
      "avatar_path": null,
      "role": "peuple",
      "status": "user",
      "foi_points": 0
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

### 3.4. Voir un profil public

```http
GET /users/:id
Authorization: Bearer <accessToken>
```

Sortie type :

```json
{
  "id": 2,
  "username": "bob",
  "bio": "Amoureux du Seigneur",
  "avatar_path": null,
  "role": "peuple",
  "status": "user",
  "foi_points": 14
}
```

---

## 4. Publications

### 4.1. Lister le feed

```http
GET /posts?page=1&limit=20
Authorization: Bearer <accessToken>
```

Sortie typique :

```json
{
  "data": [
    {
      "id": 1,
      "content": "Bonjour depuis Flutter",
      "type": "text",
      "created_at": "2026-08-13T12:00:00.000Z",
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

### 4.2. Créer un post texte

```http
POST /posts
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Entrée :

```json
{
  "content": "Bonjour depuis Flutter",
  "type": "text"
}
```

Sortie :

```json
{
  "message": "Publication créée avec succès",
  "post": {
    "id": 1,
    "content": "Bonjour depuis Flutter",
    "type": "text",
    "user_id": 1,
    "created_at": "2026-08-13T12:00:00.000Z"
  }
}
```

### 4.3. Créer un post avec fichier

```http
POST /posts
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

FormData :
- `content`: texte
- `type`: `photo` ou `video` selon le cas
- `file`: fichier média

Sortie :

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

### 4.4. Consulter un post

```http
GET /posts/:id
Authorization: Bearer <accessToken>
```

Sortie type :

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

### 4.5. Liker / unlike

- `POST /posts/:id/like`
- `DELETE /posts/:id/like`

Sortie typique :

```json
{
  "message": "Like ajouté"
}
```

### 4.6. Commenter

```http
POST /posts/:id/comments
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Entrée :

```json
{
  "content": "Super post !"
}
```

Sortie :

```json
{
  "message": "Commentaire ajouté",
  "comment": {
    "id": 1,
    "content": "Super post !",
    "post_id": 1,
    "user_id": 1,
    "created_at": "2026-08-13T12:05:00.000Z"
  }
}
```

---

## 5. Stories

### 5.1. Lister les stories

```http
GET /stories?page=1&limit=20
Authorization: Bearer <accessToken>
```

Sortie :

```json
{
  "data": [
    {
      "id": 1,
      "type": "text",
      "content": "Bonne journée !",
      "created_at": "2026-08-13T12:00:00.000Z",
      "author": {
        "id": 1,
        "username": "nouveau"
      }
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

### 5.2. Créer une story texte

```http
POST /stories
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

FormData :
- `type`: `text`
- `content`: texte

Sortie :

```json
{
  "message": "Story créée",
  "story": {
    "id": 1,
    "type": "text",
    "content": "Bonne journée !",
    "user_id": 1
  }
}
```

### 5.3. Créer une story avec image

```http
POST /stories
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

FormData :
- `type`: `image`
- `content`: texte descriptif
- `media`: image file

Sortie :

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

### 5.4. Marquer comme vue

```http
POST /stories/:id/view
Authorization: Bearer <accessToken>
```

Sortie :

```json
{
  "message": "Story vue"
}
```

---

## 6. Groupes

### 6.1. Lister les groupes

```http
GET /groups?page=1&limit=20
Authorization: Bearer <accessToken>
```

Sortie :

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
    "limit": 20,
    "totalPages": 1
  }
}
```

### 6.2. Créer un groupe

```http
POST /groups
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Entrée :

```json
{
  "name": "Mon groupe",
  "description": "Groupe Flutter"
}
```

Sortie :

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

---

## 7. Messages

### 7.1. Envoyer un message privé

```http
POST /messages
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Entrée :

```json
{
  "content": "Salut !",
  "receiver_id": 2
}
```

Sortie :

```json
{
  "message": "Message envoyé",
  "data": {
    "id": 1,
    "content": "Salut !",
    "sender_id": 1,
    "receiver_id": 2,
    "created_at": "2026-08-13T12:00:00.000Z"
  }
}
```

### 7.2. Lister les conversations

```http
GET /messages/conversations
Authorization: Bearer <accessToken>
```

Sortie :

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
      "created_at": "2026-08-13T12:00:00.000Z"
    },
    "unreadCount": 0
  }
]
```

---

## 8. Notifications

### 8.1. Lister les notifications

```http
GET /notifications?page=1&limit=20
Authorization: Bearer <accessToken>
```

Sortie :

```json
{
  "data": [
    {
      "id": 1,
      "type": "NEW_FOLLOWER",
      "content": "Un utilisateur a commencé à vous suivre.",
      "is_read": false,
      "created_at": "2026-08-13T12:00:00.000Z"
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

### 8.2. Marquer comme lue

```http
PUT /notifications/:id/read
Authorization: Bearer <accessToken>
```

Sortie :

```json
{
  "message": "Notification marquée comme lue"
}
```

---

## 9. Mapping Flutter pratique

### 9.1. Stockage du token
- Stocker `accessToken` et `refreshToken` dans un secure storage.
- Ajouter le token sur chaque requête protégée.

### 9.2. Upload de fichiers
Utiliser `MultipartFile` / `FormData` pour :
- `/posts`
- `/stories`
- `/users/me/avatar`

### 9.3. Réponse paginée
Quand une route renvoie `data` + `meta`, faire :
- `items = response.data['data']`
- `total = response.data['meta']['total']`

### 9.4. Gestion des erreurs
Toujours lire :

```json
{
  "message": "..."
}
```

et afficher un message utilisateur simple.

### 9.5. Exemple pseudo Flutter

```dart
final response = await http.post(
  Uri.parse('http://localhost:3000/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'email': 'user@example.com',
    'password': 'Password123!',
    'device': 'flutter',
  }),
);
```

```dart
final token = jsonDecode(response.body)['accessToken'];
final authHeader = {'Authorization': 'Bearer $token'};
```

---

## 10. Résumé pour le client mobile

- Auth = JWT + refresh token
- JSON pour logique métier
- Multipart pour les fichiers
- Forme standard de paginage : `data + meta`
- Plusieurs endpoints peuvent retourner automatiquement des objets imbriqués (`author`, `media`, `user`, etc.)
- Les erreurs sont simples et centrées sur le champ `message`

Cette fiche est pensée pour être directement transformée en modèles Dart / classes Flutter et en services HTTP.

