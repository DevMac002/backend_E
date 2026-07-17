# Prompt Codex — Application mobile Flutter Epika Social

Copie-colle ce prompt dans Codex depuis le dépôt qui contient les spécifications d’API d’Epika Social.

---

Tu es un développeur Flutter senior et un designer mobile product. Construis une application mobile Flutter **production-ready**, élégante et accessible pour **Epika Social**, une communauté sociale chrétienne.

Le contrat d’API ci-dessous est l’unique source de vérité côté serveur. Conçois l’application exclusivement à partir de ce contrat : n’invente ni endpoint, ni champ, ni permission, ni règle métier. N’analyse pas, ne modifie pas et ne décris pas l’implémentation interne du serveur. Si le dépôt contient `API_DOCUMENTATION.md`, utilise-le seulement pour confirmer ou compléter ce contrat ; signale toute divergence au lieu de la résoudre par une hypothèse.

## Objectif et livrable

Crée l’application Flutter dans un dossier `mobile/`, sans modifier le serveur. Elle doit compiler sur Android et iOS, avoir une architecture modulaire, de vrais appels API et aucun écran factice ou déconnecté. Configure l’URL de l’API via `--dart-define=API_BASE_URL=...`; utilise `http://10.0.2.2:3000` par défaut pour l’émulateur Android et documente les commandes de démarrage dans `mobile/README.md`.

À la fin :

1. exécute `dart format .`, `flutter analyze` et les tests pertinents ;
2. corrige les erreurs trouvées ;
3. fournis un résumé avec les fichiers créés, les parcours livrés et les limites connues du contrat d’API.

Ne me demande pas de choisir une couleur ou une architecture : applique les choix ci-dessous. Travaille par étapes cohérentes, en gardant le projet exécutable à chaque étape.

## Produit et direction artistique

Le produit doit inspirer la confiance, la sérénité, la chaleur et la vie communautaire, sans clichés visuels religieux. L’interface est en français (textes externalisables dès le départ).

- Direction : éditoriale, lumineuse, moderne et premium ; surfaces ivoire très claires, bleu nuit profond, violet/indigo comme couleur d’action, touches or doux pour les récompenses et vert doux pour les succès.
- Palette suggérée : `#101B3D` (encre), `#5B4BDB` (primaire), `#F7F7FB` (fond), `#FFFFFF` (surface), `#D9D5FF` (lavande), `#D6A93A` (or), `#E8F5ED` (succès). Vérifie les contrastes AA.
- Typographie : utilise une police Google lisible (par exemple Manrope ou Plus Jakarta Sans) avec une hiérarchie sobre. Ne force pas de texte minuscule.
- Conçois un `ThemeData` Material 3 complet : `ColorScheme`, boutons, champs, chips, cartes, modales, snackbars, états disabled/focus/error, mode sombre si le coût reste raisonnable.
- Respecte les zones sûres, les grands écrans, les lecteurs d’écran, le text scaling et les cibles tactiles d’au moins 44 px. Les icônes doivent avoir un label sémantique.
- Utilise des animations discrètes et utiles (transition de page, like, skeleton de chargement), jamais décoratives au détriment des performances.
- Pas d’interface générique en liste de rectangles : donne de l’espace, une hiérarchie nette, des avatars, des états vides illustrés par des icônes vectorielles et des CTA précis.

## Navigation et écrans attendus

Utilise `go_router` avec des routes typées ou centralisées. Après authentification, propose une barre de navigation à 5 onglets : **Accueil**, **Découvrir**, bouton central **Créer**, **Messages**, **Profil**. La cloche de notifications est accessible dans l’en-tête, avec badge.

Implémente au minimum :

1. Splash/session bootstrap, onboarding bref (si utile), connexion, inscription, saisie et renvoi OTP de vérification email, mot de passe oublié, réinitialisation, changement de mot de passe.
2. Feed Accueil : pagination infinie, pull-to-refresh, recherche, carte de publication, image/vidéo, auteur, date relative, likes, commentaires, menu propriétaire/admin, états chargement/erreur/vide.
3. Fil « Inspiration » (`predication`, `annonce`, `sondage`, `quiz`) avec filtres par type. Une annonce est mise en valeur ; un sondage affiche les choix et résultats ; un quiz donne un retour juste/faux ; une prédication est traitée comme contenu éditorial.
4. Création de post avec texte, sélecteur de média, aperçu et publication. Seuls les `admin` / `superadmin` voient les types protégés (annonce, sondage, quiz, prédication) et leurs champs associés.
5. Détail d’une publication et commentaires : ajout/suppression autorisée, liste des likes, vote/résultats de sondage et réponse/résultats de quiz selon le rôle. Mets à jour l’UI de façon optimiste avec rollback propre en cas d’échec.
6. Découvrir : recherche globale (utilisateurs, posts, groupes) et groupes. Liste/détail de groupe, membres, création de groupe `discussion`, création `cardinal` réservée admin, ajout/retrait/quitter/gestion du rôle de membre avec actions visiblement conditionnées par les permissions disponibles.
7. Messagerie : liste des conversations, compteur non lu, fil de conversation de groupe et composer. Pour les conversations directes, présente une interface propre mais **ne masque pas la limite serveur actuelle** (voir « limites ») ; n’invente pas une API de fil direct si elle n’existe pas.
8. Notifications paginées, badge non-lu, lecture individuelle/tout lire, suppression et navigation vers la ressource quand le `payload` le permet.
9. Profil public et personnel : avatar, bio, rôle, points de foi, historique des récompenses, classement Foi et réglages (édition profil/avatar, sécurité, déconnexion, suppression du compte avec confirmation destructive).
10. Espace administration, uniquement si `user.status` vaut `admin` ou `superadmin` : statistiques, recherche/liste d’utilisateurs, changement de rôle, bannissement, récompense. Réserve les fonctions superadmin (statut utilisateur, journaux) à `superadmin`.

## Architecture Flutter imposée

Choisis une structure feature-first, testable et sans logique métier dans les widgets :

```text
mobile/lib/
  app/                 # bootstrap, router, thème, DI
  core/                # env, client HTTP, erreurs, stockage, widgets partagés
  features/
    auth/ feed/ posts/ groups/ messages/ notifications/ search/ profile/ admin/
      data/ domain/ presentation/
```

- Utilise Flutter stable, `flutter_riverpod` (avec codegen si configuré proprement) pour l’état, `dio` pour HTTP, `flutter_secure_storage` pour les tokens, `image_picker` pour les médias, `cached_network_image` pour les images et `intl` pour dates/localisation. Ajoute seulement les dépendances nécessaires et compatibles.
- Crée des modèles Dart immuables, avec sérialisation sûre (`freezed`/`json_serializable` si mis en place, sinon équivalent lisible). Prévois les clés snake_case réellement reçues par l’API.
- Centralise l’authentification dans un intercepteur Dio : ajoute `Authorization: Bearer <accessToken>`, tente **une seule** actualisation avec `POST /auth/refresh` sur un 401, rejoue la requête, puis déconnecte proprement si cela échoue. Évite les rafraîchissements concurrents.
- Stocke uniquement access/refresh tokens dans le stockage sécurisé. N’enregistre jamais mot de passe ou OTP. Prévois une session restaurée au lancement.
- Utilise une enveloppe `AsyncValue`/état explicite pour chargement, erreur, vide et données. Traduis les erreurs API `{ message }` en messages actionnables ; gère les statuts 400, 401, 403, 404, 409, 410, 429 et 500.
- Crée une abstraction `ApiClient`, des repositories par feature et des services de sélection/upload média. Toutes les URL média relatives doivent être résolues contre `API_BASE_URL`.
- N’expose pas de secret dans le dépôt. Ajoute `.env.example` seulement si nécessaire, jamais de valeurs sensibles.
- Ajoute des tests unitaires pour parsing, pagination, intercepteur de refresh et règles de visibilité, plus au moins un test widget du flux de connexion ou du feed.

## Contrat d’API — source unique

Cette section décrit uniquement ce que l’application peut appeler et afficher : routes, paramètres, corps de requête, réponses, autorisations et limites observables. Elle ne décrit pas le fonctionnement interne du serveur.

### Général

- Base URL développement : `http://localhost:3000` (un appareil physique doit utiliser l’IP LAN ou une URL déployée).
- Santé : `GET /health` renvoie `{ "status": "ok", "service": "epika-social" }`.
- Sauf mention contraire, toutes les routes demandent `Authorization: Bearer <accessToken>`.
- Réponse paginée : `{ "items": [...], "pagination": { "page": 1, "limit": 20, "total": 0, "pages": 1 } }`. Paramètres `page`, `limit` (1–100) et, selon l’écran, `search` ou `q`.
- Les objets peuvent contenir `createdAt` et `updatedAt`. Prévois un parsing tolérant des dates si nécessaire.

### Authentification

- `POST /auth/register` : `{ username, email, password, device }`. `username` : 3–30, alphanumérique/underscore ; `password` : 8–72 et au moins minuscule, majuscule, chiffre et caractère spécial. `device` est obligatoire au registre **et** au login (ex. `android`, `ios`). Réponse 201 : message et `user` non vérifié.
- `POST /auth/login` : `{ email, password, device }`. Réponse : `{ accessToken, refreshToken, user }`. Un compte non vérifié retourne 403.
- `POST /auth/verify-email` : `{ email, code }`, puis retourne tokens et user. OTP 6 chiffres, expire après 10 minutes, 5 essais.
- `POST /auth/send-verification-code` : `{ email }`. Si la réponse contient aussi un `code`, **ne l’affiche ni ne le journalise en production**.
- `POST /auth/forgot-password` : `{ email }`; `POST /auth/reset-password` : `{ email, code, newPassword }`; `POST /auth/change-password` : `{ currentPassword, newPassword }`; `POST /auth/refresh` : `{ refreshToken }` → `{ accessToken }`; `POST /auth/logout` → message (invalidation essentiellement côté client).
- Objet user utile : `id`, `username`, `email`, `avatar_path`, `bio`, `role`, `status`, `foi_points`, `is_banned`, `is_verified`, `device`. `role` ∈ `peuple | constellation | tornades | tour | batview`; `status` ∈ `user | admin | superadmin`.

### Utilisateurs et administration

- `GET /users/me`, `PUT /users/me` body `{ username, bio }`, `POST /users/me/avatar` multipart avec la clé fichier **`file`**, `DELETE /users/me`.
- `GET /users/:id` ; `GET /users/:id/rewards` ; `GET /users/leaderboard/foi?limit=10` renvoie `{ leaderboard: [...] }`.
- Admin/superadmin : `GET /users?role=&status=&search=&banned=&page=&limit=`, `PUT /users/:id/role` body `{ role?, status? }`, `PUT /users/:id/ban` body `{ ban: true|false }`, `POST /users/:id/reward` body `{ montant, motif }`.
- Superadmin : `PUT /users/:id/status` body `{ status }`, `GET /users/logs/roles`.
- Admin/superadmin : `GET /admin/stats`, `GET /admin/stats/growth`; superadmin : `GET /admin/logs`.

### Publications

- `GET /posts?page=&limit=&search=` retourne seulement `type: post`, avec l’auteur (`User`), `Likes` et `Comments`. `GET /posts/predications?...` retourne `annonce | sondage | quiz | predication`, avec l’auteur.
- `POST /posts` est un **multipart/form-data** : `content`, `type` (`post`, `predication`, `annonce`, `sondage`, `quiz`), `visible_to` (actuellement seulement `all`), `options`, `reponse_correcte`, `date_limite`, et le média sous `file`. Les champs `options` peuvent arriver sous forme de chaîne : pour créer un sondage/quiz, sérialise le tableau avec `jsonEncode(...)` et vérifie ensuite le comportement du serveur. Les types autres que `post` sont réservés admin/superadmin.
- `GET /posts/:id`, `PUT /posts/:id` body `{ content, type }`, `DELETE /posts/:id`.
- `POST /posts/:id/like`, `DELETE /posts/:id/like`, `GET /posts/:id/likes`.
- `GET /posts/:id/comments`, `POST /posts/:id/comments` body `{ content }`, `DELETE /posts/:id/comments/:commentId`.
- `POST /posts/:id/vote` body `{ option_index }`, `GET /posts/:id/results`. Ne propose pas un second vote si l’UI sait déjà que l’utilisateur a voté, mais gère une erreur possible du serveur.
- `POST /posts/:id/answer` body `{ answer }` → `{ correct, answer }`, `GET /posts/:id/quiz-results`.
- Une publication contient notamment : `id`, `author_id`, `content`, `media_path`, `type`, `visible_to`, `options`, `reponse_correcte`, `date_limite`, dates et auteur. **Ne divulgue jamais `reponse_correcte` à un utilisateur normal dans l’UI** ; cette donnée peut être présente dans la réponse, donc masque-la côté client. Les résultats de quiz sont à traiter comme une vue administrative.

### Groupes, messages, notifications et recherche

- Groupes : `GET /groups?search=&page=&limit=`, `GET /groups/discover?...`, `GET /groups/:id`, `POST /groups` body `{ nom, description, type }`, `PUT /groups/:id` body `{ nom, description }`, `DELETE /groups/:id`.
- Le type de groupe est `discussion | cardinal`; la création `cardinal` exige admin/superadmin. Après création, le créateur est considéré comme `moderateur`.
- Membres : `GET /groups/:id/members`, `POST /groups/:id/members` body `{ user_id, role_in_group }`, `DELETE /groups/:id/members/:userId`, `POST /groups/:id/leave`, `PUT /groups/:id/members/:userId/role` body `{ role_in_group }`. `role_in_group` = `membre | moderateur`.
- Messages : `GET /messages/conversations`, `GET /messages/unread-count` → `{ count }`, `GET /messages/:conversationId` (cette route filtre actuellement par **`group_id`**), `POST /messages` body `{ group_id?, receiver_id?, content?, media_path? }`, `PUT /messages/:id/read`, `PUT /messages/conversations/:conversationId/read-all`.
- Notifications : `GET /notifications?page=&limit=`, `GET /notifications/unread-count`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`, `DELETE /notifications/:id`. Objet : `id`, `type`, `message`, `payload`, `is_read`, dates. Les payloads usuels ont `postId`, `groupId` ou `messageId`.
- Recherche : `GET /search?q=` → `{ users, posts, groups }`; `GET /search/users?q=`, `GET /search/groups?q=`. Les résultats sont simples : ne suppose pas de pagination.

### Médias et temps réel

- Avatar et post acceptent JPEG, PNG, WebP, MP4, MOV ; la couche HTTP accepte jusqu’à 10 Mo mais le stockage effectif limite à 4 Mo. Bloque les fichiers au-delà de **4 Mo** côté client avec un message clair. Les images sont redimensionnées côté serveur.
- Les réponses API retournent les chemins média tels que `/media/123`. Pour les afficher : `'$API_BASE_URL/media/123'`. `GET /media/:id` est public. `DELETE /media/:id` est réservé au propriétaire ou admin/superadmin.
- Le temps réel est optionnel. Conçois des repositories rafraîchissables et un polling léger ou un rafraîchissement au retour au premier plan comme solution de base ; isole une future intégration temps réel derrière une interface, sans exiger de clés dans l’application.

## Limites du contrat d’API à respecter et à signaler

- Les actions de modification/suppression de groupes et de gestion des membres ne disposent pas de permissions suffisamment précises dans le contrat. Masque les actions selon les informations connues, mais ne présente jamais ce filtrage UI comme un contrôle de sécurité.
- Les groupes ne fournissent pas de champ `is_private`. N’affiche ni réglage de confidentialité ni action de « rejoindre » qui ne figure pas dans les routes listées.
- La liste des conversations et le fil disponible ne permettent pas d’afficher un historique fiable de messages directs. Signale-le sobrement dans le README et n’invente pas de fil DM.
- L’API de vote ne garantit pas l’unicité d’un vote et ne fournit pas le vote courant de l’utilisateur. Empêche le double tap pendant la session, tout en considérant la réponse API comme référence.
- Certaines réponses ou autorisations peuvent être plus larges que les actions affichées dans l’interface. Les contrôles UI améliorent l’expérience ; ils ne remplacent jamais la sécurité serveur.

## Critères d’acceptation

- Aucun endpoint inventé, et toutes les requêtes authentifiées portent le Bearer token.
- Inscription → OTP → session, login → session restaurée, refresh token et logout sont fonctionnels.
- Feed, détail, interactions, notifications, recherche, profils, groupes et médias sont reliés à l’API et présentent systématiquement chargement/erreur/vide.
- Les permissions de rôle/statut masquent les actions non autorisées, tout en gérant un 403 retourné par le serveur.
- Design cohérent et soigné sur téléphone compact, téléphone grand et thème système ; aucun overflow avec une taille de police élevée.
- Le README du dossier `mobile/` explique prérequis, URL API Android/iOS/appareil, lancement, tests, et les limites du contrat d’API ci-dessus.

Commence par lire ce contrat d’API, initialise `mobile/` si nécessaire, puis implémente le produit plutôt que de répondre par une proposition théorique.
