# Epika Social - Documentation API Complète

## Table des matières
1. [Informations générales](#informations-générales)
2. [Authentification](#authentification)
3. [Utilisateurs](#utilisateurs)
4. [Publications (Posts)](#publications-posts)
5. [Commentaires](#commentaires)
6. [Likes](#likes)
7. [Groupes](#groupes)
8. [Membres de groupes](#membres-de-groupes)
9. [Messages](#messages)
10. [Stories](#stories)
11. [Média](#média)
12. [Notifications](#notifications)
13. [Gestion Administrateur](#gestion-administrateur)

---

## Informations générales

### Base URL
- **Développement:** `http://localhost:3000`
- **Production:** Défini par la variable `BASE_URL`

### Headers requis
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

### Réponse standard d'erreur
```json
{
  "message": "Description de l'erreur",
  "error": "Détails techniques (optionnel)"
}
```

### Codes de statut HTTP
- `200` - Succès
- `201` - Créé
- `400` - Mauvaise requête
- `401` - Non autorisé
- `403` - Accès refusé
- `404` - Non trouvé
- `429` - Trop de requêtes (rate limit)
- `500` - Erreur serveur

---

## Authentification

### POST /auth/register
Créer un nouveau compte utilisateur.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "device": "web"
}
```

**Validation du mot de passe:**
- Minimum 8 caractères
- Maximum 72 caractères
- Au moins une minuscule, une majuscule, un chiffre et un caractère spécial

**Response (201):**
```json
{
  "message": "Utilisateur créé avec succès",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "auth_provider": "local",
    "role": "peuple",
    "status": "user",
    "is_verified": false,
    "foi_points": 0,
    "avatar_path": null,
    "created_at": "2026-09-01T10:00:00.000Z"
  }
}
```

**Rate Limit:** 10 requêtes par heure

---

### POST /auth/login
Authentifier un utilisateur avec email/mot de passe.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "device": "web"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "peuple",
    "status": "user",
    "foi_points": 150
  }
}
```

**Rate Limit:** 20 tentatives par 15 minutes

---

### POST /auth/google
Authentifier avec Google OAuth.

**Request Body:**
```json
{
  "credential": "<google_id_token>",
  "device": "web"
}
```

**Response (200):**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": 2,
    "username": "jane_user_123",
    "email": "jane@gmail.com",
    "auth_provider": "google",
    "role": "peuple",
    "status": "user",
    "is_verified": true,
    "avatar_path": "https://..."
  }
}
```

---

### POST /auth/send-verification-code
Renvoyer le code de vérification par email.

**Response (200):**
```json
{
  "message": "Code de vérification envoyé à votre email"
}
```

**Rate Limit:** 10 tentatives par 15 minutes

---

### POST /auth/verify-email
Vérifier l'email avec le code OTP.

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "Email vérifié avec succès",
  "user": {
    "id": 1,
    "is_verified": true
  }
}
```

---

### POST /auth/forgot-password
Demander un code de réinitialisation de mot de passe.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Code de réinitialisation envoyé à votre email"
}
```

**Rate Limit:** 5 tentatives par heure

---

### POST /auth/reset-password
Réinitialiser le mot de passe avec le code OTP.

**Request Body:**
```json
{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "message": "Mot de passe réinitialisé avec succès"
}
```

---

### POST /auth/change-password
Changer le mot de passe de l'utilisateur actuel.

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "message": "Mot de passe modifié avec succès"
}
```

---

### POST /auth/refresh
Renouveler le token d'accès.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /auth/logout
Se déconnecter de la session actuelle.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "message": "Déconnecté avec succès"
}
```

---

## Utilisateurs

### GET /users/me
Récupérer le profil de l'utilisateur actuel.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "avatar_path": "https://...",
  "bio": "Biographie utilisateur",
  "role": "peuple",
  "status": "user",
  "foi_points": 250,
  "is_verified": true,
  "is_banned": false,
  "created_at": "2026-09-01T10:00:00.000Z",
  "updated_at": "2026-09-01T10:00:00.000Z"
}
```

---

### PUT /users/me
Mettre à jour le profil.

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "username": "john_doe_new",
  "bio": "Nouvelle biographie",
  "device": "mobile"
}
```

**Response (200):**
```json
{
  "message": "Profil mis à jour",
  "user": {
    "id": 1,
    "username": "john_doe_new",
    "bio": "Nouvelle biographie"
  }
}
```

---

### POST /users/me/change-email
Changer l'adresse email.

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "newEmail": "newemail@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Email changé avec succès. Un code de vérification a été envoyé au nouvel email."
}
```

---

### POST /users/me/avatar
Télécharger ou remplacer l'avatar.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request:**
```
Form Data:
- file: <image_file> (JPG, PNG, GIF, WebP)
```

**Response (200):**
```json
{
  "message": "Avatar téléchargé",
  "avatar_path": "/media/avatars/user_1_avatar.jpg"
}
```

---

### DELETE /users/me
Supprimer le compte.

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Compte supprimé avec succès"
}
```

---

### GET /users/me/devices
Lister les appareils/sessions actifs.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)

**Response (200):**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "device": "web",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "last_seen_at": "2026-09-01T10:00:00.000Z",
      "revoked_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### DELETE /users/me/devices/:sessionId
Révoquer une session/appareil.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "message": "Session révoquée"
}
```

---

### GET /users
Lister tous les utilisateurs.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)
- `search` (optionnel, filtre par username)

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "username": "john_doe",
      "avatar_path": "...",
      "foi_points": 250,
      "role": "peuple"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### GET /users/:id
Récupérer le profil public d'un utilisateur.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "avatar_path": "...",
  "bio": "Biographie",
  "role": "constellation",
  "foi_points": 250,
  "created_at": "2026-09-01T10:00:00.000Z"
}
```

---

### GET /users/:id/rewards
Récupérer l'historique des récompenses d'un utilisateur.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "montant": 50,
      "motif": "Post viral",
      "admin": {
        "id": 5,
        "username": "admin_user"
      },
      "created_at": "2026-09-01T10:00:00.000Z"
    }
  ],
  "total": 10,
  "total_points": 250,
  "page": 1,
  "limit": 20
}
```

---

### GET /users/leaderboard/foi
Récupérer le classement des points de foi.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)

**Response (200):**
```json
{
  "items": [
    {
      "rank": 1,
      "user": {
        "id": 1,
        "username": "john_doe",
        "avatar_path": "...",
        "foi_points": 1000
      }
    },
    {
      "rank": 2,
      "user": {
        "id": 2,
        "username": "jane_doe",
        "avatar_path": "...",
        "foi_points": 950
      }
    }
  ],
  "page": 1,
  "limit": 20
}
```

---

### GET /users/logs/roles
Récupérer l'historique des changements de rôle. **(SuperAdmin uniquement)**

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "user": {
        "id": 10,
        "username": "john_doe"
      },
      "ancien_role": "peuple",
      "nouveau_role": "constellation",
      "ancien_statut": "user",
      "nouveau_statut": "user",
      "changed_by": {
        "id": 1,
        "username": "admin"
      },
      "created_at": "2026-09-01T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### GET /users/:id/devices
Lister les appareils d'un utilisateur. **(Admin/SuperAdmin uniquement)**

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "device": "web",
      "ip_address": "192.168.1.1",
      "last_seen_at": "2026-09-01T10:00:00.000Z"
    }
  ]
}
```

---

### PUT /users/:id/role
Changer le rôle communautaire d'un utilisateur. **(Admin/SuperAdmin uniquement)**

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "role": "constellation"
}
```

**Rôles valides:** `peuple`, `constellation`, `tornades`, `tour`, `batview`

**Response (200):**
```json
{
  "message": "Rôle mis à jour",
  "user": {
    "id": 10,
    "username": "john_doe",
    "role": "constellation"
  }
}
```

---

### PUT /users/:id/status
Changer le statut administratif. **(SuperAdmin uniquement)**

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "status": "admin"
}
```

**Statuts valides:** `user`, `admin`, `superadmin`

**Response (200):**
```json
{
  "message": "Statut mis à jour",
  "user": {
    "id": 10,
    "username": "john_doe",
    "status": "admin"
  }
}
```

---

### PUT /users/:id/ban
Bannir un utilisateur. **(Admin/SuperAdmin uniquement)**

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "reason": "Contenu inapproprié"
}
```

**Response (200):**
```json
{
  "message": "Utilisateur banni",
  "user": {
    "id": 10,
    "is_banned": true,
    "block_reason": "Contenu inapproprié"
  }
}
```

---

### PUT /users/:id/temporary-block
Bloquer temporairement un utilisateur. **(Admin/SuperAdmin uniquement)**

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "durationMinutes": 60,
  "reason": "Spam"
}
```

**Response (200):**
```json
{
  "message": "Utilisateur bloqué temporairement",
  "user": {
    "id": 10,
    "blocked_until": "2026-09-01T11:00:00.000Z"
  }
}
```

---

### PUT /users/:id/restrictions
Mettre à jour les restrictions d'accès. **(Admin/SuperAdmin uniquement)**

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "restrictions": {
    "posts": true,
    "comments": false,
    "messages": true
  }
}
```

**Response (200):**
```json
{
  "message": "Restrictions mises à jour",
  "user": {
    "id": 10,
    "access_restrictions": {
      "posts": true,
      "comments": false,
      "messages": true
    }
  }
}
```

---

### POST /users/:id/reward
Récompenser un utilisateur. **(Admin/SuperAdmin uniquement)**

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "montant": 100,
  "motif": "Contribution communautaire exceptionnelle"
}
```

**Response (200):**
```json
{
  "message": "Récompense accordée",
  "reward": {
    "id": 1,
    "user_id": 10,
    "montant": 100,
    "motif": "Contribution communautaire exceptionnelle",
    "admin_id": 1
  }
}
```

---

### DELETE /users/:id/admin
Supprimer un utilisateur. **(Admin/SuperAdmin uniquement)**

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "message": "Utilisateur supprimé"
}
```

---

## Publications (Posts)

### GET /posts
Récupérer le fil d'actualité.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)
- `search` (optionnel)

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "content": "Contenu du post",
      "type": "post",
      "author": {
        "id": 1,
        "username": "john_doe",
        "avatar_path": "..."
      },
      "media_path": "...",
      "likes_count": 45,
      "comments_count": 12,
      "likes": [],
      "created_at": "2026-09-01T10:00:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

### GET /posts/predications
Récupérer le fil des prédications et annonces.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)

**Response (200):**
```json
{
  "items": [
    {
      "id": 2,
      "content": "Prédication importante",
      "type": "predication",
      "author": {
        "id": 5,
        "username": "pastor_john"
      },
      "created_at": "2026-09-01T10:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

## Commentaires

### GET /posts/:id/comments
Lister les commentaires d'un post.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "content": "Très bon post!",
      "author": {
        "id": 2,
        "username": "jane_doe",
        "avatar_path": "..."
      },
      "created_at": "2026-09-01T10:00:00.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

### POST /posts/:id/comments
Ajouter un commentaire.

**Headers:** `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "content": "Très bon post!"
}
```

**Response (201):**
```json
{
  "message": "Commentaire ajouté",
  "comment": {
    "id": 100,
    "post_id": 1,
    "content": "Très bon post!",
    "author_id": 2,
    "created_at": "2026-09-01T10:00:00.000Z"
  }
}
```

---

### DELETE /posts/:id/comments/:commentId
Supprimer un commentaire.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "message": "Commentaire supprimé"
}
```

---

## Messages

### GET /messages/conversations
Lister les conversations.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)

**Response (200):**
```json
{
  "items": [
    {
      "conversation_id": "user_2",
      "type": "direct",
      "other_user": {
        "id": 2,
        "username": "jane_doe",
        "avatar_path": "..."
      },
      "last_message": {
        "content": "Salut comment ça va?",
        "created_at": "2026-09-01T10:00:00.000Z"
      },
      "unread_count": 3
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

---

### GET /messages/unread-count
Récupérer le nombre de messages non lus.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "total_unread": 5,
  "by_conversation": {
    "user_2": 3,
    "group_1": 2
  }
}
```

---

### GET /messages/:conversationId
Lister les messages d'une conversation.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 50)

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "sender": {
        "id": 1,
        "username": "john_doe",
        "avatar_path": "..."
      },
      "content": "Salut!",
      "media_path": null,
      "is_read": true,
      "created_at": "2026-09-01T10:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

### POST /messages
Envoyer un message.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Response (201):**
```json
{
  "message": "Message envoyé"
}
```

---

## Stories

### GET /stories
Lister les stories des contacts.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "username": "john_doe",
        "avatar_path": "..."
      },
      "content": "Contenu de la story",
      "media_path": "...",
      "expires_at": "2026-09-02T10:00:00.000Z",
      "created_at": "2026-09-01T10:00:00.000Z"
    }
  ]
}
```

---

### POST /stories
Créer une story.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Response (201):**
```json
{
  "message": "Story créée"
}
```

---

### DELETE /stories/:id
Supprimer une story.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "message": "Story supprimée"
}
```

---

## Notifications

### GET /notifications
Lister les notifications.

**Headers:** `Authorization: Bearer {accessToken}`

**Query Parameters:**
- `page` (optionnel, défaut: 1)
- `limit` (optionnel, défaut: 20)

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "type": "like",
      "content": "John a aimé votre post",
      "isRead": false,
      "createdAt": "2026-09-01T10:00:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

---

### PUT /notifications/:id/read
Marquer une notification comme lue.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "message": "Notification marquée comme lue"
}
```

---

### DELETE /notifications/:id
Supprimer une notification.

**Headers:** `Authorization: Bearer {accessToken}`

**Response (200):**
```json
{
  "message": "Notification supprimée"
}
```

---

## Pagination

Tous les endpoints qui retournent des listes supportent la pagination:

**Query Parameters:**
- `page` (défaut: 1)
- `limit` (défaut: 20, max: 100)

**Response:**
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

## Codes d'erreur courants

| Code | Message | Explication |
|------|---------|------------|
| 400 | Bad Request | Requête invalide ou paramètres manquants |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource non trouvée |
| 429 | Too Many Requests | Rate limit dépassé |
| 500 | Internal Server Error | Erreur serveur |

---

## Rate Limits

| Endpoint | Limite |
|----------|--------|
| /auth/register | 10 par heure |
| /auth/login | 20 par 15 minutes |
| /auth/send-verification-code | 10 par 15 minutes |
| /auth/forgot-password | 5 par heure |
| /posts (POST) | 50 par 15 minutes |
| /messages (POST) | 100 par 15 minutes |

---

## Formats de date/heure
- Format ISO 8601: `2026-09-01T10:00:00.000Z`
- Fuseau horaire: UTC
