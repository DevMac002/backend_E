# Epika Social — Backend

API Node.js/Express pour le réseau social chrétien Epika Social. Elle fournit l’authentification par JWT et OTP email, le feed, les groupes, la messagerie, les notifications, les médias stockés en base de données et des outils d’administration.

La documentation interactive est disponible sur `/docs` et sa spécification OpenAPI sur `/docs/openapi.json`.

Le journal d’audit est disponible publiquement sur `/logs` sur l’environnement local comme hébergé, sans connexion. Les entrées sont également disponibles en JSON sur `/logs/api`.

## Prérequis et démarrage

- Node.js 18 ou supérieur
- Une base MariaDB accessible

```bash
npm install
cp .env.example .env
npm run dev
```

Le serveur écoute sur `http://localhost:3000` par défaut. Vérifier son état :

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "service": "epika-social" }
```

Variables principales :

```env
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

DB_HOST=...
DB_PORT=3306
DB_NAME=epika_social
DB_USER=...
DB_PASSWORD=...
DB_DIALECT=mariadb
DB_SSL=true

JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=...
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...

# Active les événements Pusher applicatifs si configuré.
PUSHER_ENABLED=false
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=...
```

En développement, la base est synchronisée automatiquement et un superadministrateur initial peut être créé avec `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_USERNAME` et `DEFAULT_ADMIN_PASSWORD`.

En production, appliquer la migration [20260718_add_moderation_and_media_metadata.sql](database/migrations/20260718_add_moderation_and_media_metadata.sql) avant le déploiement de cette version.

## Conventions d’API

Les routes protégées requièrent :

```http
Authorization: Bearer <accessToken>
```

Les réponses de listes paginées acceptent généralement `page` et `limit`; les feeds et listes de groupes acceptent aussi `search`. Le limiteur global autorise 200 requêtes par 15 minutes, avec des limites plus strictes pour l’inscription, la connexion et la création de publications.

Les rôles communautaires possibles sont `peuple`, `constellation`, `tornades`, `tour` et `batview`. Les statuts d’administration sont `user`, `admin` et `superadmin` (le statut `superadmin` est réservé au compte existant ou à l’initialisation).
## Statuts, rôles et permissions

### Statuts d'administration (Authorization)

| Statut | Droits |
|---|---|
| `user` | Utilisateur régulier. Accès à toutes les fonctionnalités publiques : création de publications, commentaires, messagerie, groupes, etc. |
| `admin` | Administrateur plateforme. Peut gérer les utilisateurs (ban, blocage temporaire, restrictions d'accès), modifier les rôles communautaires des utilisateurs réguliers, attribuer des récompenses Foi, accéder aux statistiques. **Ne peut pas gérer un autre administrateur ou un superadministrateur.** |
| `superadmin` | Superadministrateur. Accès complet. Peut gérer tous les utilisateurs (y compris les administrateurs), modifier les statuts d'administration, consulter l'intégralité des journaux. **Protégé de toute action de gestion d'administration.** |

### Restrictions d'accès par utilisateur

Un utilisateur peut être restreint (restriction d'accès) sur les fonctionnalités suivantes. Les restrictions peuvent être appliquées indépendamment :

- `posts` — Création de publications bloquée
- `comments` — Ajout de commentaires bloqué
- `messages` — Envoi de messages privés bloqué
- `groups` — Création/participation à des groupes bloquée
- `stories` — Création de stories bloquée

**Note :** Les restrictions peuvent être appliquées par un administrateur ou un superadministrateur. Elles sont stockées en JSON dans le champ `access_restrictions` de l'utilisateur.

### Restrictions temporelles

Un utilisateur peut être **bloqué temporairement** avec un motif et une date/heure de fin. Le blocage est levé automatiquement à son expiration. Pendant un blocage, toutes les API retourrent une erreur 403 `Compte temporairement bloqué`.

### Ban (Bannissement permanent)

Un utilisateur banni est privé d'accès à toutes les fonctionnalités. Toute tentative d'accès retourne une erreur 403 `Utilisateur banni`.

## Matrice des permissions — Qui peut faire quoi?

### Édition de profil

| Action | Utilisateur régulier | Admin | Superadmin | Non authentifié |
|---|---|---|---|---|
| Consulter son profil (`GET /users/me`) | ✅ | ✅ | ✅ | ❌ |
| Modifier son profil (`PUT /users/me`) | ✅ | ✅ | ✅ | ❌ |
| Modifier son email (`POST /users/me/change-email`) | ✅ | ✅ | ✅ | ❌ |
| Envoyer/modifier son avatar (`POST /users/me/avatar`) | ✅ | ✅ | ✅ | ❌ |
| Supprimer son compte (`DELETE /users/me`) | ✅ | ✅ | ✅ | ❌ |
| Consulter ses appareils/sessions (`GET /users/me/devices`) | ✅ | ✅ | ✅ | ❌ |
| Se déconnecter d'un appareil (`DELETE /users/me/devices/:sessionId`) | ✅ | ✅ | ✅ | ❌ |

### Gestion des utilisateurs (Administration)

| Action | Admin | Superadmin |
|---|---|---|
| Lister tous les utilisateurs (`GET /users`) | ✅ | ✅ |
| Consulter un profil utilisateur (`GET /users/:id`) | ✅ (voir les infos publiques) | ✅ |
| Consulter les appareils d'un utilisateur (`GET /users/:id/devices`) | ✅ | ✅ |
| Modifier le rôle communautaire (`PUT /users/:id/role`) | ✅ (utilisateurs réguliers seulement) | ✅ |
| Modifier le statut d'administration (`PUT /users/:id/status`) | ❌ | ✅ |
| Bannir/débannir un utilisateur (`PUT /users/:id/ban`) | ✅ (utilisateurs réguliers seulement) | ✅ |
| Bloquer temporairement (`PUT /users/:id/temporary-block`) | ✅ (utilisateurs réguliers seulement) | ✅ |
| Appliquer des restrictions d'accès (`PUT /users/:id/restrictions`) | ✅ (utilisateurs réguliers seulement) | ✅ |
| Attribuer des points Foi (`POST /users/:id/reward`) | ✅ | ✅ |
| Supprimer un compte (`DELETE /users/:id/admin`) | ✅ (utilisateurs réguliers seulement) | ✅ |
| Consulter les journaux de rôle/statut (`GET /users/logs/roles`) | ❌ | ✅ |

### Publications, commentaires, likes

| Action | Créateur | Utilisateur régulier | Admin | Superadmin |
|---|---|---|---|---|
| Lister le feed (`GET /posts`) | ✅ | ✅ | ✅ | ✅ |
| Consulter une publication (`GET /posts/:id`) | ✅ | ✅ | ✅ | ✅ |
| Créer une publication (`POST /posts`) | ✅ (si non restreint) | ✅ (si non restreint) | ✅ | ✅ |
| Modifier sa publication (`PUT /posts/:id`) | ✅ | ❌ | ✅ (toute pub) | ✅ |
| Supprimer sa publication (`DELETE /posts/:id`) | ✅ | ❌ | ✅ (toute pub) | ✅ |
| Liker/unliker (`POST/DELETE /posts/:id/like`) | ✅ | ✅ | ✅ | ✅ |
| Consulter les likes (`GET /posts/:id/likes`) | ✅ | ✅ | ✅ | ✅ |
| Ajouter un commentaire (`POST /posts/:id/comments`) | ✅ (si non restreint) | ✅ (si non restreint) | ✅ | ✅ |
| Supprimer son commentaire (`DELETE /posts/:id/comments/:commentId`) | ✅ | ❌ | ✅ (tout commentaire) | ✅ |
| Voter sur un sondage (`POST /posts/:id/vote`) | ✅ | ✅ | ✅ | ✅ |
| Consulter les résultats sondage (`GET /posts/:id/results`) | ✅ | ✅ | ✅ | ✅ |
| Répondre à un quiz (`POST /posts/:id/answer`) | ✅ | ✅ | ✅ | ✅ |

**Annonces, sondages, quiz et prédications** : Réservés aux **Admin et Superadmin** uniquement pour la création. Tous les utilisateurs authentifiés peuvent les consulter, voter et répondre.

### Stories éphémères

| Action | Créateur | Utilisateur régulier | Admin | Superadmin |
|---|---|---|---|---|
| Créer une story (`POST /stories`) | ✅ (si non restreint) | ✅ (si non restreint) | ✅ | ✅ |
| Lister le feed (`GET /stories`) | ✅ | ✅ | ✅ | ✅ |
| Consulter une story (`GET /stories/:id`) | ✅ (sienne ou suivis) | ✅ (si autorisé) | ✅ | ✅ |
| Consulter les stories d'un utilisateur (`GET /stories/user/:userId`) | ✅ (ses propres) | ✅ (suivis, non bloqués) | ✅ | ✅ |
| Supprimer une story (`DELETE /stories/:id`) | ✅ | ❌ | ✅ (toute story) | ✅ |
| Marquer comme vue (`POST /stories/:id/view`) | ✅ | ✅ | ✅ | ✅ |
| Voir les vues (`GET /stories/:id/viewers`) | ✅ (créateur) | ❌ | ✅ | ✅ |

### Groupes

| Action | Créateur/Modérateur | Membre | Utilisateur régulier | Admin | Superadmin |
|---|---|---|---|---|---|
| Lister les groupes (`GET /groups`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Découvrir des groupes (`GET /groups/discover`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Consulter un groupe (`GET /groups/:id`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Créer un groupe discussion (`POST /groups`) | ✅ (si non restreint) | ❌ | ✅ (si non restreint) | ✅ | ✅ |
| Créer un groupe cardinal (`POST /groups`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Modifier un groupe (`PUT /groups/:id`) | ✅ (créateur) | ❌ | ❌ | ✅ (tout groupe) | ✅ |
| Supprimer un groupe (`DELETE /groups/:id`) | ✅ (créateur) | ❌ | ❌ | ✅ (tout groupe) | ✅ |
| Lister les membres (`GET /groups/:id/members`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ajouter un membre (`POST /groups/:id/members`) | ✅ (créateur/modérateur) | ❌ | Soi-même | ✅ (tout groupe) | ✅ |
| Retirer un membre (`DELETE /groups/:id/members/:userId`) | ✅ (créateur/modérateur) | ❌ (sauf soi-même) | ❌ | ✅ (tout groupe) | ✅ |
| Quitter un groupe (`POST /groups/:id/leave`) | ✅ | ✅ | — | — | — |
| Modifier le rôle d'un membre (`PUT /groups/:id/members/:userId/role`) | ✅ (créateur/modérateur) | ❌ | ❌ | ✅ (tout groupe) | ✅ |
| Créer un code d'invitation (`POST /groups/:id/invitation-codes`) | ✅ (créateur) | ❌ | ❌ | ✅ | ✅ |
| Lister les codes (`GET /groups/:id/invitation-codes`) | ✅ (créateur) | ❌ | ❌ | ✅ | ✅ |
| Modifier un code (`PUT /groups/:id/invitation-codes/:codeId`) | ✅ (créateur) | ❌ | ❌ | ✅ | ✅ |
| Révoquer un code (`DELETE /groups/:id/invitation-codes/:codeId`) | ✅ (créateur) | ❌ | ❌ | ✅ | ✅ |
| Rejoindre via code (`POST /groups/join-by-code`) | — | — | ✅ (si code valide) | ✅ (si code valide) | ✅ (si code valide) |
| Valider un code (`GET /groups/join-by-code/validate`) | ✅ | ✅ | ✅ | ✅ | ✅ |

### Messagerie

| Action | Expéditeur | Destinataire/Membre | Admin | Superadmin |
|---|---|---|---|---|
| Lister les conversations (`GET /messages/conversations`) | ✅ (siennes) | ❌ | ✅ | ✅ |
| Consulter les messages d'une conversation (`GET /messages/:conversationId`) | ✅ (siennes) | ❌ | ✅ | ✅ |
| Envoyer un message (`POST /messages`) | ✅ (si non restreint) | — | ✅ | ✅ |
| Marquer un message comme lu (`PUT /messages/:id/read`) | ❌ | ✅ (reçu) | — | — |
| Marquer une conversation comme lue (`PUT /messages/conversations/:conversationId/read-all`) | — | ✅ | — | — |
| Consulter les non-lus (`GET /messages/unread-count`) | ✅ | ✅ | ✅ | ✅ |

### Notifications

| Action | Utilisateur | Admin | Superadmin |
|---|---|---|---|
| Lister ses notifications (`GET /notifications`) | ✅ | ✅ | ✅ |
| Consulter les non-lues (`GET /notifications/unread-count`) | ✅ | ✅ | ✅ |
| Marquer une notification comme lue (`PUT /notifications/:id/read`) | ✅ (siennes) | ✅ | ✅ |
| Marquer toutes comme lues (`PUT /notifications/read-all`) | ✅ | ✅ | ✅ |
| Supprimer une notification (`DELETE /notifications/:id`) | ✅ (siennes) | ✅ | ✅ |

### Recherche et statistiques

| Action | Utilisateur | Admin | Superadmin |
|---|---|---|---|
| Recherche globale (`GET /search?q=...`) | ✅ | ✅ | ✅ |
| Recherche utilisateurs (`GET /search/users?q=...`) | ✅ | ✅ | ✅ |
| Recherche groupes (`GET /search/groups?q=...`) | ✅ | ✅ | ✅ |
| Statistiques globales (`GET /admin/stats`) | ❌ | ✅ | ✅ |
| Croissance inscriptions (`GET /admin/stats/growth`) | ❌ | ✅ | ✅ |
| Journaux rôle/modération (`GET /admin/logs`) | ❌ | ❌ | ✅ |

### Médias et Stories

| Action | Propriétaire | Admin | Superadmin | Public |
|---|---|---|---|---|
| Consulter un média (`GET /media/:id`) | ✅ | ✅ | ✅ | ✅ |
| Supprimer un média (`DELETE /media/:id`) | ✅ | ✅ (tout média) | ✅ | ❌ |
| Consulter une story (`GET /stories/:id`) | ✅ (créateur ou suivis) | ✅ | ✅ | — |
| Supprimer une story (`DELETE /stories/:id`) | ✅ | ✅ (toute story) | ✅ | ❌ |
## Authentification

| Méthode | Route | Authentification | Description |
|---|---|---|---|
| POST | `/auth/register` | Non | Inscription; requiert `username`, `email`, `password` et `device` |
| POST | `/auth/login` | Non | Connexion; requiert `email`, `password` et `device` |
| POST | `/auth/send-verification-code` | Non | Renvoie un code OTP de vérification |
| POST | `/auth/verify-email` | Non | Valide l’email avec `email` et `code`; retourne les JWT |
| POST | `/auth/forgot-password` | Non | Demande un code de réinitialisation |
| POST | `/auth/reset-password` | Non | Réinitialise avec `email`, `code`, `newPassword` |
| POST | `/auth/change-password` | Oui | Change le mot de passe avec `currentPassword`, `newPassword` |
| POST | `/auth/refresh` | Non | Génère un access token depuis `refreshToken` |
| POST | `/auth/logout` | Non | Termine le flux côté client |

Le mot de passe à l’inscription doit avoir 8 à 72 caractères et contenir minuscule, majuscule, chiffre et caractère spécial. Les OTP expirent après 10 minutes et sont limités à cinq tentatives.

## Utilisateurs et administration des comptes

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/users/me` | Auth | Profil connecté |
| PUT | `/users/me` | Auth | Modifier `username` et/ou `bio` |
| POST | `/users/me/avatar` | Auth | Envoyer un fichier sous le champ `file` |
| DELETE | `/users/me` | Auth | Supprimer son compte |
| POST | `/users/me/change-email` | Auth | Modifier l’email avec `email` et `currentPassword`; un OTP est envoyé à la nouvelle adresse |
| GET | `/users/me/devices` | Auth | Lister les appareils/sessions du compte |
| DELETE | `/users/me/devices/:sessionId` | Auth | Déconnecter un appareil |
| GET | `/users/:id` | Auth | Profil d’un utilisateur |
| GET | `/users` | Admin/Superadmin | Liste et filtres `role`, `status`, `banned`, `search`, `page`, `limit` |
| PUT | `/users/:id/role` | Admin/Superadmin | Modifier le rôle communautaire (`role`) |
| PUT | `/users/:id/status` | Superadmin | Modifier le statut (`status`: `user` ou `admin`) |
| PUT | `/users/:id/ban` | Admin/Superadmin | Bannir/débannir (`ban`, vrai par défaut) |
| PUT | `/users/:id/temporary-block` | Admin/Superadmin | Bloquer jusqu’à `until` (ISO 8601), ou envoyer `until: null` pour lever le blocage |
| PUT | `/users/:id/restrictions` | Admin/Superadmin | Restreindre `posts`, `comments`, `messages` et/ou `groups` avec des booléens |
| POST | `/users/:id/reward` | Admin/Superadmin | Attribuer des points Foi (`montant`, `motif` facultatif) |
| GET | `/users/:id/rewards` | Auth | Historique des récompenses |
| GET | `/users/leaderboard/foi` | Auth | Classement Foi (`limit`, 10 par défaut) |
| GET | `/users/logs/roles` | Superadmin | Historique des changements de rôle/statut |
| DELETE | `/users/:id/admin` | Admin/Superadmin | Supprimer un compte gérable |
| GET | `/users/:id/devices` | Admin/Superadmin | Voir les appareils d’un utilisateur gérable |

### Pouvoirs d’administration attendus

Un administrateur ou un superadministrateur peut, dans les limites de son niveau de privilège :

- supprimer un compte utilisateur ;
- bannir ou débannir un utilisateur ;
- bloquer temporairement un compte, avec un motif et une date/heure de fin ;
- attribuer des points Foi et consulter leur historique ;
- affecter un utilisateur à un groupe ou l’en retirer ;
- restreindre sélectivement ses accès (publications, commentaires, messagerie, participation aux groupes, stories ou autres fonctionnalités définies par le produit) ;
- modifier son rôle communautaire et, pour le superadministrateur, ses droits d'administration ;
- supprimer les stories d'un utilisateur en cas de contenu inapproprié.

Toute action d’administration doit être journalisée avec l’administrateur concerné, le compte ciblé, le motif, la date de début et, lorsqu’elle existe, la date de fin. Une restriction temporaire doit être levée automatiquement à son expiration. Les administrateurs ne peuvent pas gérer un superadministrateur; les règles précises de hiérarchie sont appliquées côté serveur.

## Journal d’audit

Chaque requête API, y compris les requêtes refusées par le rate limiting et le contrôle de santé, est enregistrée dans `audit_logs` avec l’utilisateur identifié, la méthode, le chemin, le code de réponse, l’adresse IP, l’agent utilisateur et les paramètres non sensibles. Les mots de passe, OTP et jetons ne sont jamais journalisés. Le tableau de consultation est exposé publiquement sur `/logs` et ses données JSON sur `/logs/api`.

## Publications, sondages et quiz

Les types disponibles sont `post`, `annonce`, `sondage`, `quiz` et `predication`. Les quatre derniers sont réservés aux administrateurs et superadministrateurs.

| Méthode | Route | Description |
|---|---|---|
| GET | `/posts` | Feed des publications classiques (`type=post`) |
| GET | `/posts/predications` | Feed des annonces, sondages, quiz et prédications |
| POST | `/posts` | Créer une publication; accepte `multipart/form-data` et le champ pièce jointe `file` |
| GET | `/posts/:id` | Détail d’une publication |
| PUT | `/posts/:id` | Modifier sa publication, ou toute publication pour un admin |
| DELETE | `/posts/:id` | Supprimer sa publication, ou toute publication pour un admin |
| POST / DELETE | `/posts/:id/like` | Ajouter/retirer un like |
| GET | `/posts/:id/likes` | Liste des likes |
| GET / POST | `/posts/:id/comments` | Lister/ajouter un commentaire (`content`) |
| DELETE | `/posts/:id/comments/:commentId` | Supprimer son commentaire, ou tout commentaire pour un admin |
| POST | `/posts/:id/vote` | Voter à un sondage (`option_index`) |
| GET | `/posts/:id/results` | Votes d’un sondage |
| POST | `/posts/:id/answer` | Répondre à un quiz (`answers`, tableau) |
| GET | `/posts/:id/quiz-results` | Résultats détaillés, réservés à l’auteur ou à un admin |

Un quiz requiert une question (`content`), un `quiz_type` (`true_false`, `single_choice` ou `multiple_choice`), des choix et des réponses correctes. Pour les envois multipart, `choices`, `correct_answers` et `answers` peuvent être des tableaux JSON sérialisés.

Une publication peut inclure une pièce jointe de tout type : image, vidéo, note vocale ou fichier documentaire (PDF, Word, Excel, archive, etc.). La pièce jointe est transmise avec le champ multipart `file`; son type MIME, son nom original et sa taille doivent être conservés afin que le client puisse l’afficher, la lire ou la télécharger selon son format.
## Stories éphémères

Les stories sont des contenus temporaires et éphémères, similaires à ceux de WhatsApp ou Instagram. Elles disparaissent automatiquement après 24 heures (ou une durée configurée). Les stories peuvent contenir du texte et/ou des médias (images, vidéos, etc.).

### Gestion des stories

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/stories` | Auth | Lister les stories des utilisateurs suivis (`page`, `limit`) |
| POST | `/stories` | Auth | Créer une story (`content`, `media_path` facultatif) |
| GET | `/stories/:id` | Auth | Consulter une story spécifique |
| DELETE | `/stories/:id` | Créateur/Admin/Superadmin | Supprimer sa story ou toute story (admin) |
| POST | `/stories/:id/view` | Auth | Marquer une story comme vue |
| GET | `/stories/:id/viewers` | Créateur | Lister les utilisateurs qui ont vu la story |
| GET | `/stories/user/:userId` | Auth | Lister toutes les stories d'un utilisateur (sauf si bloqué) |

Le créateur et les administrateurs de plateforme peuvent supprimer une story. Toutes les routes requièrent un utilisateur authentifié non banni.

### Schéma d'une story

```json
{
  "id": 1,
  "user_id": 42,
  "content": "Ma première story!",
  "media_path": "/media/123",
  "media_type": "image/jpeg",
  "expires_at": "2026-07-20T10:00:00Z",
  "view_count": 5,
  "is_viewed": true,
  "created_at": "2026-07-19T10:00:00Z"
}
```

- `id` : Identifiant unique de la story.
- `user_id` : Identifiant du créateur.
- `content` : Texte facultatif de la story.
- `media_path` : URL du média stocké (image, vidéo, etc.), nullable.
- `media_type` : Type MIME du média (ex: `image/jpeg`, `video/mp4`), nullable.
- `expires_at` : Date/heure d'expiration (24h par défaut après création). Passée cette heure, la story n'est plus visible.
- `view_count` : Nombre d'utilisateurs ayant vu la story.
- `is_viewed` : Booléen indiquant si l'utilisateur connecté a vu cette story (pertinent pour le feed).
- `created_at` : Date de création.

### Règles de validation des stories

1. **Contenu ou média obligatoire** : Une story doit avoir au minimum du texte (`content`) ou un média (`media_path`). Les deux peuvent être présents.

2. **Durée de vie** : Les stories expirent après 24 heures (configurable via `STORY_EXPIRATION_HOURS` en variables d'environnement; par défaut 24).

3. **Suppression automatique** : Une story expirée n'est plus listée et ne peut pas être consultée (retour 404).

4. **Un seul créateur** : Un utilisateur ne peut créer/modifier que ses propres stories.

5. **Visibilité** : Une story est visible par :
   - Le créateur (toujours)
   - Les utilisateurs qui le suivent (ou tous si compte public)
   - **Sauf** les utilisateurs qui l'ont bloqué

6. **Tracabilité des vues** : Chaque vue est enregistrée avec l'utilisateur et l'heure de visualisation. Le créateur peut voir la liste des utilisateurs qui ont vu sa story, avec l'heure.

### Permissions — Stories

| Action | Créateur | Utilisateur régulier | Admin | Superadmin |
|---|---|---|---|---|
| Créer une story (`POST /stories`) | ✅ (si non restreint) | ✅ (si non restreint) | ✅ | ✅ |
| Lister le feed des stories (`GET /stories`) | ✅ | ✅ | ✅ | ✅ |
| Consulter une story (`GET /stories/:id`) | ✅ (sienne ou suivis) | ✅ (si autorisé) | ✅ | ✅ |
| Consulter les stories d'un utilisateur (`GET /stories/user/:userId`) | ✅ (ses propres) | ✅ (suivis, non bloqués) | ✅ | ✅ |
| Supprimer sa story (`DELETE /stories/:id`) | ✅ | ❌ | ✅ (toute story) | ✅ |
| Marquer comme vue (`POST /stories/:id/view`) | ✅ | ✅ | ✅ | ✅ |
| Voir les utilisateurs ayant consulté (`GET /stories/:id/viewers`) | ✅ (créateur) | ❌ | ✅ | ✅ |

### Cas d'usage courants

**Créer une story avec texte seul** :
```bash
POST /stories
{
  "content": "Bonne journée à tous!"
}
```

**Créer une story avec média** :
```bash
POST /stories
{
  "content": "Voici mon moment du jour",
  "media_path": "/media/456"
}
```

**Lister les stories du feed** :
```bash
GET /stories?page=1&limit=20
```
Retourne les stories des utilisateurs suivis, ordonnées par date de création décroissante. Les stories expirées ne sont pas retournées.

**Marquer une story comme vue** :
```bash
POST /stories/42/view
```
Enregistre la vue et met à jour le compteur. Peut être appelé plusieurs fois (une seule vue par utilisateur et par story).

**Consulter les vues d'une story** :
```bash
GET /stories/42/viewers
```
Retourne la liste des utilisateurs ayant vu la story avec l'heure de visualisation (créateur seulement).

**Supprimer une story** :
```bash
DELETE /stories/42
```
La story devient immédiatement inaccessible, même avant expiration.
## Groupes

Les groupes ont le type `discussion` par défaut ou `cardinal`; la création d’un groupe cardinal est réservée aux administrateurs. Le créateur devient modérateur.

### Gestion des groupes

| Méthode | Route | Description |
|---|---|---|
| GET / POST | `/groups` | Lister/créer des groupes |
| GET | `/groups/discover` | Découvrir des groupes |
| GET / PUT / DELETE | `/groups/:id` | Consulter/modifier/supprimer un groupe |
| GET / POST | `/groups/:id/members` | Lister/ajouter un membre (`user_id`, `role_in_group` facultatif); les admins peuvent affecter un utilisateur à un groupe |
| DELETE | `/groups/:id/members/:userId` | Retirer un membre |
| POST | `/groups/:id/leave` | Quitter un groupe |
| PUT | `/groups/:id/members/:userId/role` | Changer `role_in_group` (`membre` ou `moderateur`) |

Le créateur et les administrateurs de plateforme gèrent les réglages; les modérateurs peuvent gérer les membres. Toutes les routes de groupes requièrent un utilisateur authentifié non banni.

### Système de codes d'invitation pour les groupes

Les administrateurs peuvent générer des **codes d'invitation uniques** pour permettre aux utilisateurs de rejoindre des groupes via un code saisi dans un champ. Les codes peuvent être :

- **Individuels** : un code unique attribué à un utilisateur spécifique; utilisable une seule fois.
- **Groupés** (ou réutilisables) : un code partagé qui peut être utilisé par plusieurs utilisateurs; peut avoir une limite d'utilisations ou être illimité.

Les codes sont attachés à un groupe et possèdent un statut (actif, revoqué ou expiré).

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/groups/:id/invitation-codes` | Créateur/Admin/Superadmin | Générer un code d'invitation (`type`: `individual` ou `group`, `user_id` obligatoire si `individual`, `max_uses` facultatif pour `group`) |
| GET | `/groups/:id/invitation-codes` | Créateur/Admin/Superadmin | Lister les codes d'invitation du groupe |
| PUT | `/groups/:id/invitation-codes/:codeId` | Créateur/Admin/Superadmin | Modifier un code (`max_uses`, `status`: `active` ou `revoked`) |
| DELETE | `/groups/:id/invitation-codes/:codeId` | Créateur/Admin/Superadmin | Supprimer/révoquer un code |
| POST | `/groups/join-by-code` | Auth | Rejoindre un groupe via un code (`code`) |
| GET | `/groups/join-by-code/validate` | Auth | Valider un code sans rejoindre (`code`) |

### Schéma d'un code d'invitation

```json
{
  "id": 1,
  "group_id": 42,
  "code": "ABC123XYZ789",
  "type": "individual",
  "user_id": 15,
  "max_uses": 1,
  "uses": 1,
  "status": "active",
  "expires_at": "2026-08-19T12:00:00Z",
  "created_by_admin_id": 2,
  "created_at": "2026-07-19T10:00:00Z"
}
```

- `code` : Chaîne alphanumérque unique, sensible à la casse (ex: `ABC123XYZ789`).
- `type` : `individual` ou `group`.
- `user_id` : Requis si `type === 'individual'`; nullable sinon.
- `max_uses` : Nombre maximum d'utilisations; `null` = illimité.
- `uses` : Nombre d'utilisations actuelles.
- `status` : `active`, `revoked` ou `expired`.
- `expires_at` : Date d'expiration optionnelle; `null` = pas d'expiration.

### Règles de validation des codes

1. **Code individuel** : Peut être utilisé **une seule fois** par l'utilisateur spécifié (`user_id`). Une fois utilisé, il devient `expired`.
2. **Code groupé** : Peut être utilisé par **n'importe quel utilisateur** jusqu'à `max_uses` (ou illimité). Lorsque `uses === max_uses`, le code devient `expired`.
3. **Code révoqué** : Un code avec `status === 'revoked'` ne peut plus être utilisé.
4. **Code expiré** : Un code avec `status === 'expired'` ou une `expires_at` passée ne peut plus être utilisé.
5. **Un utilisateur ne peut pas rejoindre deux fois** : Si l'utilisateur est déjà membre du groupe, la tentative de jonction via code échoue (retour 409).

### Permissions — Codes d'invitation

| Action | Créateur du groupe | Admin/Superadmin | Utilisateur régulier |
|---|---|---|---|
| Créer un code (`POST /groups/:id/invitation-codes`) | ✅ | ✅ | ❌ |
| Lister les codes (`GET /groups/:id/invitation-codes`) | ✅ | ✅ | ❌ |
| Modifier un code (`PUT /groups/:id/invitation-codes/:codeId`) | ✅ | ✅ | ❌ |
| Révoquer/supprimer un code (`DELETE /groups/:id/invitation-codes/:codeId`) | ✅ | ✅ | ❌ |
| Utiliser un code pour rejoindre (`POST /groups/join-by-code`) | ✅ (si autorisé) | ✅ (si autorisé) | ✅ (si autorisé) |
| Valider un code (`GET /groups/join-by-code/validate`) | ✅ | ✅ | ✅ |

### Cas d'usage courants

**Inviter un utilisateur spécifique** :
```bash
POST /groups/42/invitation-codes
{
  "type": "individual",
  "user_id": 15
}
```
Retourne un code utilisable une seule fois par cet utilisateur.

**Créer un code de groupe pour invite ouverte** :
```bash
POST /groups/42/invitation-codes
{
  "type": "group",
  "max_uses": 50,
  "expires_at": "2026-08-19T12:00:00Z"
}
```
Retourne un code réutilisable jusqu'à 50 fois avant expiration.

**Rejoindre via un code** :
```bash
POST /groups/join-by-code
{ "code": "ABC123XYZ789" }
```
Ajoute l'utilisateur au groupe si le code est valide et actif.

**Révoquer un code** :
```bash
DELETE /groups/42/invitation-codes/1
```
Le code devient inutilisable immédiatement.

## Messagerie et notifications

| Méthode | Route | Description |
|---|---|---|
| GET | `/messages/conversations` | Messages des conversations privées accessibles |
| GET | `/messages/unread-count` | Nombre de messages privés non lus |
| GET | `/messages/:conversationId` | Messages d’un groupe ou conversation avec l’utilisateur indiqué |
| POST | `/messages` | Envoyer `content` et/ou `media_path`, avec exactement un de `group_id` ou `receiver_id` |
| PUT | `/messages/:id/read` | Marquer un message privé reçu comme lu |
| PUT | `/messages/conversations/:conversationId/read-all` | Marquer les messages d’une conversation comme lus |
| GET | `/notifications` | Lister les notifications (`page`, `limit`) |
| GET | `/notifications/unread-count` | Nombre de notifications non lues |
| PUT | `/notifications/:id/read` | Marquer une notification comme lue |
| PUT | `/notifications/read-all` | Marquer toutes les notifications comme lues |
| DELETE | `/notifications/:id` | Supprimer une notification |

## Recherche, statistiques et médias

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/search?q=...` | Auth | Recherche globale |
| GET | `/search/users?q=...` | Auth | Recherche d’utilisateurs |
| GET | `/search/groups?q=...` | Auth | Recherche de groupes |
| GET | `/admin/stats` | Admin/Superadmin | Statistiques globales |
| GET | `/admin/stats/growth` | Admin/Superadmin | Croissance des inscriptions |
| GET | `/admin/logs` | Superadmin | Journaux de rôle/statut et de modération |
| GET | `/media/:id` | Public | Lire un média stocké en base |
| DELETE | `/media/:id` | Propriétaire/Admin/Superadmin | Supprimer un média |

Les pièces jointes de publications passent par le champ multipart `file`. Elles peuvent être de tout type : images, vidéos, audios/notes vocales, PDF, documents Word ou Excel, archives, etc. Le serveur doit contrôler la taille des fichiers et stocker leur type MIME, leur nom original et leur contenu afin de les restituer correctement. Les médias sont stockés dans MariaDB et référencés par une URL telle que `/media/42`.

## Temps réel

Le serveur Socket.IO utilise le JWT au handshake :

```js
const socket = io(URL, { auth: { token: accessToken } });
```

Événements Socket.IO actuellement gérés : `presence:online`, `presence:offline`, `message:send`, `message:receive`, `post:new`, `notification:new`, `poll:vote_update`, `story:new` et `story:viewed`. Le backend peut aussi publier, lorsque `PUSHER_ENABLED=true`, des événements Pusher privés tels que `message:receive`, `notification:new`, `group:member_added`, `user:role_updated`, `user:status_updated`, `user:ban_updated` et `story:new`.

## Points importants
### Règles générales d'autorisation

1. **Authentification requise** : Toutes les fonctionnalités sauf l'authentification (`/auth/*`, sauf `/auth/logout`) requièrent un JWT valide.

2. **Comptes bannis** : Une action protégée est refusée aux comptes bannis (retour 403).

3. **Comptes bloqués temporairement** : Tout accès API aux comptes temporairement bloqués est refusé (retour 403 avec date/motif).

4. **Restrictions d'accès** : Les restrictions individuelles (`posts`, `comments`, `messages`, `groups`) bloquent les opérations d'écriture correspondantes (non appliquées à la lecture).

5. **Hiérarchie d'administration** :
   - Un `admin` ne peut gérer que les utilisateurs réguliers (`user`).
   - Un `admin` ne peut **pas** modifier un autre `admin` ou un `superadmin`.
   - Un `superadmin` peut tout gérer.
   - Un `superadmin` est protégé contre les actions de gestion (ban, blocage, restrictions).

6. **Propriété des contenus** :
   - Les utilisateurs réguliers ne peuvent modifier ou supprimer que leur propre contenu (publications, commentaires).
   - Les administrateurs peuvent modifier ou supprimer n'importe quel contenu utilisateur.

7. **Journalisation** : Les actions d'administration (changements de rôle/statut, ban, blocage) sont journalisées dans les logs de modération.

### Cas d'usage courants

- **Modérer un utilisateur toxique** : `PUT /users/:id/ban` (admin) ou `PUT /users/:id/temporary-block` (admin).
- **Restreindre les publications d'un utilisateur** : `PUT /users/:id/restrictions` avec `{ "posts": true }` (admin).
- **Restreindre les stories** : `PUT /users/:id/restrictions` avec `{ "stories": true }` (admin).
- **Promouvoir un utilisateur modérateur** : `PUT /users/:id/role` avec le nouveau rôle (admin/superadmin).
- **Consulter l'historique des actions administratives** : `GET /admin/logs` (superadmin seulement).
- **Créer une story** : `POST /stories` avec du texte et/ou un média.
- **Voir qui a consulté une story** : `GET /stories/:id/viewers` (créateur de la story).

### Événements en temps réel

Via Socket.IO avec authentification JWT :

- `presence:online` / `presence:offline` — Statut de connexion des utilisateurs.
- `message:send` / `message:receive` — Nouveaux messages privés.
- `post:new` — Nouvelle publication au feed.
- `story:new` — Nouvelle story publiée par un utilisateur suivi.
- `story:viewed` — Une story a été vue (créateur reçoit l'événement avec l'identité du spectateur).
- `notification:new` — Nouvelle notification.
- `poll:vote_update` — Vote sur un sondage.

Les événements Pusher (si `PUSHER_ENABLED=true`) incluent aussi les changements d'administration : `user:role_updated`, `user:status_updated`, `user:ban_updated`, `group:member_added` et `story:new`.

### Détails d'implémentation
- Une action protégée est refusée aux comptes bannis.
- Les changements de rôle et de statut sont journalisés dans l’historique des rôles.
- Les suppressions utilisent les opérations Sequelize actuelles; ce projet ne déclare pas de mécanisme générique de suppression logique.
- Les routes effectives, les schémas de requête et les statuts HTTP détaillés sont consultables dans Swagger sur `/docs`.
