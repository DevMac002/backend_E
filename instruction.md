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
- restreindre sélectivement ses accès (publication, commentaires, messagerie, participation aux groupes ou autres fonctionnalités définies par le produit) ;
- modifier son rôle communautaire et, pour le superadministrateur, ses droits d’administration.

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

## Groupes

Les groupes ont le type `discussion` par défaut ou `cardinal`; la création d’un groupe cardinal est réservée aux administrateurs. Le créateur devient modérateur.

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

Événements Socket.IO actuellement gérés : `presence:online`, `presence:offline`, `message:send`, `message:receive`, `post:new`, `notification:new` et `poll:vote_update`. Le backend peut aussi publier, lorsque `PUSHER_ENABLED=true`, des événements Pusher privés tels que `message:receive`, `notification:new`, `group:member_added`, `user:role_updated`, `user:status_updated` et `user:ban_updated`.

## Points importants

- Une action protégée est refusée aux comptes bannis.
- Les changements de rôle et de statut sont journalisés dans l’historique des rôles.
- Les suppressions utilisent les opérations Sequelize actuelles; ce projet ne déclare pas de mécanisme générique de suppression logique.
- Les routes effectives, les schémas de requête et les statuts HTTP détaillés sont consultables dans Swagger sur `/docs`.
