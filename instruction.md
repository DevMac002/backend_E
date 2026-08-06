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

### Connexion

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Password123\!","device":"flutter"}'
```

Réponse attendue :

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": 1, "username": "..." }
}
```

### Rafraîchir le token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
```

### Déconnexion

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
```

## Utilisateur connecté

### Récupérer le profil

```bash
curl http://localhost:3000/users/me \
  -H 'Authorization: Bearer <accessToken>'
```

### Mettre à jour le profil

```bash
curl -X PUT http://localhost:3000/users/me \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"username":"nouveau","bio":"Bio Flutter"}'
```

## Publications

### Lister le feed

```bash
curl http://localhost:3000/posts?page=1&limit=20 \
  -H 'Authorization: Bearer <accessToken>'
```

### Créer une publication (post, photo, quiz, etc.)

```bash
curl -X POST http://localhost:3000/posts \
  -H 'Authorization: Bearer <accessToken>' \
  -F 'content=Bonjour depuis Flutter' \
  -F 'type=text'
```

Avec fichier média :

```bash
curl -X POST http://localhost:3000/posts \
  -H 'Authorization: Bearer <accessToken>' \
  -F 'content=Photo from Flutter' \
  -F 'type=photo' \
  -F 'file=@/path/to/photo.jpg'
```

### Consulter une publication

```bash
curl http://localhost:3000/posts/1 \
  -H 'Authorization: Bearer <accessToken>'
```

### Ajouter un commentaire

```bash
curl -X POST http://localhost:3000/posts/1/comments \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"content":"Super post \!"}'
```

## Stories

### Lister les stories

```bash
curl http://localhost:3000/stories?page=1&limit=20 \
  -H 'Authorization: Bearer <accessToken>'
```

### Créer une story texte

```bash
curl -X POST http://localhost:3000/stories \
  -H 'Authorization: Bearer <accessToken>' \
  -F 'type=text' \
  -F 'content=Bonne journée \!'
```

### Créer une story média

```bash
curl -X POST http://localhost:3000/stories \
  -H 'Authorization: Bearer <accessToken>' \
  -F 'type=image' \
  -F 'content=Une image depuis Flutter' \
  -F 'media=@/path/to/image.jpg'
```

### Consulter une story

```bash
curl http://localhost:3000/stories/1 \
  -H 'Authorization: Bearer <accessToken>'
```

### Marquer une story comme vue

```bash
curl -X POST http://localhost:3000/stories/1/view \
  -H 'Authorization: Bearer <accessToken>'
```

### Voir les viewers d'une story

```bash
curl http://localhost:3000/stories/1/viewers \
  -H 'Authorization: Bearer <accessToken>'
```

## Groupes

### Lister les groupes

```bash
curl http://localhost:3000/groups?page=1&limit=20 \
  -H 'Authorization: Bearer <accessToken>'
```

### Créer un groupe

```bash
curl -X POST http://localhost:3000/groups \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mon groupe","description":"Groupe Flutter"}'
```

## Messagerie

### Envoyer un message privé

```bash
curl -X POST http://localhost:3000/messages \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"content":"Salut \!","receiver_id":2}'
```

### Lister les conversations

```bash
curl http://localhost:3000/messages/conversations \
  -H 'Authorization: Bearer <accessToken>'
```

## Notifications

### Lister les notifications

```bash
curl http://localhost:3000/notifications \
  -H 'Authorization: Bearer <accessToken>'
```

### Marquer une notification comme lue

```bash
curl -X PUT http://localhost:3000/notifications/1/read \
  -H 'Authorization: Bearer <accessToken>'
```

## Exemple Flutter

Pour Flutter, utiliser `http.MultipartRequest` pour les endpoints `POST /posts` et `POST /stories` avec fichiers.

- Auth : `POST /auth/login`
- Créer une publication : `POST /posts` avec `content`, `type`, et `file`
- Créer une story : `POST /stories` avec `type`, `content`, et `media`
- Récupérer le feed : `GET /posts`, `GET /stories`
- Protéger les requêtes avec `Authorization: Bearer <token>`

