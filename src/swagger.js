const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Epika Social API',
    version: '1.0.0',
    description: 'Documentation Swagger de l’API Epika Social. Tous les endpoints existants sont décrits, ainsi que les routes Stories planifiées.',
    contact: {
      name: 'Epika Social',
      url: 'https://github.com/epika-social',
    },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development server' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentification et gestion de session' },
    { name: 'Users', description: 'Profils, administration et gestion des comptes' },
    { name: 'Posts', description: 'Publications, likes, commentaires, sondages et quiz' },
    { name: 'Groups', description: 'Groupes, membres et invitations' },
    { name: 'Messages', description: 'Messagerie privée et conversations' },
    { name: 'Notifications', description: 'Notifications utilisateur' },
    { name: 'Search', description: 'Recherche de contenus et d’utilisateurs' },
    { name: 'Admin', description: 'Statistiques et journaux d’administration' },
    { name: 'Media', description: 'Médias stockés et suppression' },
    { name: 'Site', description: 'Contenu et upload CMS' },
    { name: 'Logs', description: 'Logs publics et export' },
    { name: 'Stories', description: 'Stories éphémères et vues', deprecated: true },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      AuthRegister: {
        type: 'object',
        required: ['username', 'email', 'password', 'device'],
        properties: {
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          device: { type: 'string' },
        },
      },
      AuthLogin: {
        type: 'object',
        required: ['email', 'password', 'device'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          device: { type: 'string' },
        },
      },
      AuthTokenRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      AuthVerifyEmail: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string' },
        },
      },
      AuthPasswordReset: {
        type: 'object',
        required: ['email', 'code', 'newPassword'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string' },
          newPassword: { type: 'string', format: 'password' },
        },
      },
      AuthChangePassword: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password' },
          newPassword: { type: 'string', format: 'password' },
        },
      },
      AuthRefresh: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string' },
          status: { type: 'string' },
          bio: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      UserUpdate: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          bio: { type: 'string' },
        },
      },
      ChangeEmailRequest: {
        type: 'object',
        required: ['email', 'currentPassword'],
        properties: {
          email: { type: 'string', format: 'email' },
          currentPassword: { type: 'string', format: 'password' },
        },
      },
      UserRoleUpdate: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', description: 'Community role' },
        },
      },
      UserStatusUpdate: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['user', 'admin'] },
        },
      },
      UserBanUpdate: {
        type: 'object',
        properties: {
          ban: { type: 'boolean', default: true },
        },
      },
      UserTemporaryBlock: {
        type: 'object',
        properties: {
          until: { type: ['string', 'null'], format: 'date-time', description: 'ISO 8601 expiration or null pour lever le blocage' },
          reason: { type: 'string' },
        },
      },
      UserRestrictions: {
        type: 'object',
        properties: {
          posts: { type: 'boolean' },
          comments: { type: 'boolean' },
          messages: { type: 'boolean' },
          groups: { type: 'boolean' },
          stories: { type: 'boolean' },
        },
      },
      RewardCreate: {
        type: 'object',
        required: ['montant'],
        properties: {
          montant: { type: 'number' },
          motif: { type: 'string' },
        },
      },
      PostCreate: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          type: { type: 'string', description: 'Type de publication: post, annonce, sondage, quiz, predication' },
          choices: { type: 'array', items: { type: 'string' } },
          correct_answers: { type: 'array', items: { type: 'integer' } },
          quiz_type: { type: 'string', enum: ['true_false', 'single_choice', 'multiple_choice'] },
        },
      },
      CommentCreate: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string' },
        },
      },
      VoteCreate: {
        type: 'object',
        required: ['option_index'],
        properties: {
          option_index: { type: 'integer' },
        },
      },
      QuizAnswer: {
        type: 'object',
        required: ['answers'],
        properties: {
          answers: { type: 'array', items: { type: 'integer' } },
        },
      },
      GroupCreate: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['discussion', 'cardinal'] },
        },
      },
      GroupMemberCreate: {
        type: 'object',
        properties: {
          user_id: { type: 'integer' },
          role_in_group: { type: 'string' },
        },
      },
      MessageCreate: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          media_path: { type: 'string' },
          group_id: { type: 'integer' },
          receiver_id: { type: 'integer' },
        },
      },
      NotificationList: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'object' } },
          total: { type: 'integer' },
        },
      },
      SearchQuery: {
        type: 'object',
        properties: {
          q: { type: 'string' },
        },
      },
      StoryCreate: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          media_path: { type: 'string' },
        },
      },
      StoryView: {
        type: 'object',
        properties: {
          viewed: { type: 'boolean' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte utilisateur',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthRegister' } },
          },
        },
        responses: {
          '201': { description: 'Utilisateur créé' },
          '400': { description: 'Requête invalide', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter et obtenir des tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthLogin' } },
          },
        },
        responses: {
          '200': { description: 'Connexion réussie' },
          '401': { description: 'Identifiants incorrects' },
        },
      },
    },
    '/auth/send-verification-code': {
      post: {
        tags: ['Auth'],
        summary: 'Envoyer un code de vérification par email',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthTokenRequest' } },
          },
        },
        responses: {
          '200': { description: 'Code envoyé' },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Vérifier un email avec OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthVerifyEmail' } },
          },
        },
        responses: {
          '200': { description: 'Email vérifié et JWT retournés' },
          '400': { description: 'Code invalide ou expiré' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Demander un code de réinitialisation',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthTokenRequest' } },
          },
        },
        responses: {
          '200': { description: 'Code de réinitialisation envoyé' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Réinitialiser le mot de passe',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthPasswordReset' } },
          },
        },
        responses: {
          '200': { description: 'Mot de passe réinitialisé' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Changer le mot de passe',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthChangePassword' } },
          },
        },
        responses: {
          '200': { description: 'Mot de passe modifié' },
          '401': { description: 'Non autorisé' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rafraîchir un access token',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AuthRefresh' } },
          },
        },
        responses: {
          '200': { description: 'Nouveau token retourné' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Se déconnecter',
        responses: {
          '200': { description: 'Déconnexion réussie' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Récupérer le profil de l’utilisateur authentifié',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Profil utilisateur retourné', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
          '401': { description: 'Non autorisé' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Mettre à jour le profil de l’utilisateur connecté',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserUpdate' } },
          },
        },
        responses: {
          '200': { description: 'Profil mis à jour' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Supprimer son compte',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Compte supprimé' },
        },
      },
    },
    '/users/me/avatar': {
      post: {
        tags: ['Users'],
        summary: 'Envoyer ou remplacer l’avatar',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Avatar uploadé' },
        },
      },
    },
    '/users/me/change-email': {
      post: {
        tags: ['Users'],
        summary: 'Changer l’adresse email du compte connecté',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ChangeEmailRequest' } },
          },
        },
        responses: {
          '200': { description: 'Email mis à jour' },
        },
      },
    },
    '/users/me/devices': {
      get: {
        tags: ['Users'],
        summary: 'Lister les appareils/sessions du compte connecté',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Liste des sessions retournée' },
        },
      },
    },
    '/users/me/devices/{sessionId}': {
      delete: {
        tags: ['Users'],
        summary: 'Supprimer une session de l’utilisateur connecté',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Session révoquée' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Lister les utilisateurs (admin/superadmin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'banned', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Liste d’utilisateurs' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Récupérer un utilisateur par ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Utilisateur retourné' },
        },
      },
    },
    '/users/{id}/rewards': {
      get: {
        tags: ['Users'],
        summary: 'Voir l’historique des récompenses d’un utilisateur',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Historique retourné' },
        },
      },
    },
    '/users/leaderboard/foi': {
      get: {
        tags: ['Users'],
        summary: 'Récupérer le classement Foi',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }],
        responses: {
          '200': { description: 'Classement retourné' },
        },
      },
    },
    '/users/logs/roles': {
      get: {
        tags: ['Users'],
        summary: 'Voir l’historique des changements de rôle/statut',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Journaux retournés' },
          '403': { description: 'Accès réservé aux superadmins' },
        },
      },
    },
    '/users/{id}/devices': {
      get: {
        tags: ['Users'],
        summary: 'Voir les appareils d’un utilisateur',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Liste des appareils retournée' },
        },
      },
    },
    '/users/{id}/role': {
      put: {
        tags: ['Users'],
        summary: 'Modifier le rôle communautaire d’un utilisateur',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserRoleUpdate' } },
          },
        },
        responses: {
          '200': { description: 'Rôle mis à jour' },
        },
      },
    },
    '/users/{id}/status': {
      put: {
        tags: ['Users'],
        summary: 'Modifier le statut d’administration d’un utilisateur',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserStatusUpdate' } },
          },
        },
        responses: {
          '200': { description: 'Statut mis à jour' },
        },
      },
    },
    '/users/{id}/ban': {
      put: {
        tags: ['Users'],
        summary: 'Bannir ou débannir un utilisateur',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserBanUpdate' } },
          },
        },
        responses: {
          '200': { description: 'Statut de bannissement mis à jour' },
        },
      },
    },
    '/users/{id}/temporary-block': {
      put: {
        tags: ['Users'],
        summary: 'Bloquer temporairement un utilisateur',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserTemporaryBlock' } },
          },
        },
        responses: {
          '200': { description: 'Blocage temporaire appliqué ou levé' },
        },
      },
    },
    '/users/{id}/restrictions': {
      put: {
        tags: ['Users'],
        summary: 'Appliquer des restrictions d’accès à un utilisateur',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserRestrictions' } },
          },
        },
        responses: {
          '200': { description: 'Restrictions appliquées' },
        },
      },
    },
    '/users/{id}/reward': {
      post: {
        tags: ['Users'],
        summary: 'Attribuer des points Foi',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RewardCreate' } },
          },
        },
        responses: {
          '200': { description: 'Points Foi attribués' },
        },
      },
    },
    '/users/{id}/admin': {
      delete: {
        tags: ['Users'],
        summary: 'Supprimer un compte utilisateur gérable',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Compte supprimé' },
        },
      },
    },
    '/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Lister le feed de publications',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Feed retourné' },
        },
      },
      post: {
        tags: ['Posts'],
        summary: 'Créer une publication',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  type: { type: 'string' },
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Publication créée' },
        },
      },
    },
    '/posts/predications': {
      get: {
        tags: ['Posts'],
        summary: 'Lister le feed des annonces, sondages, quiz et prédications',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Flux de prédications retourné' },
        },
      },
    },
    '/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Récupérer une publication par ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Publication retournée' } },
      },
      put: {
        tags: ['Posts'],
        summary: 'Modifier une publication',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PostCreate' } },
          },
        },
        responses: { '200': { description: 'Publication mise à jour' } },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Supprimer une publication',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Publication supprimée' } },
      },
    },
    '/posts/{id}/like': {
      post: {
        tags: ['Posts'],
        summary: 'Liker une publication',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Publication likée' } },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Retirer un like',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Like retiré' } },
      },
    },
    '/posts/{id}/likes': {
      get: {
        tags: ['Posts'],
        summary: 'Lister les likes d’une publication',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Likes listés' } },
      },
    },
    '/posts/{id}/comments': {
      get: {
        tags: ['Posts'],
        summary: 'Lister les commentaires d’une publication',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Commentaires listés' } },
      },
      post: {
        tags: ['Posts'],
        summary: 'Ajouter un commentaire',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CommentCreate' } },
          },
        },
        responses: { '201': { description: 'Commentaire créé' } },
      },
    },
    '/posts/{id}/comments/{commentId}': {
      delete: {
        tags: ['Posts'],
        summary: 'Supprimer un commentaire',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'commentId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Commentaire supprimé' } },
      },
    },
    '/posts/{id}/vote': {
      post: {
        tags: ['Posts'],
        summary: 'Voter sur un sondage',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/VoteCreate' } },
          },
        },
        responses: { '200': { description: 'Vote enregistré' } },
      },
    },
    '/posts/{id}/results': {
      get: {
        tags: ['Posts'],
        summary: 'Consulter les résultats d’un sondage',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Résultats retournés' } },
      },
    },
    '/posts/{id}/answer': {
      post: {
        tags: ['Posts'],
        summary: 'Répondre à un quiz',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/QuizAnswer' } },
          },
        },
        responses: { '200': { description: 'Réponse enregistrée' } },
      },
    },
    '/posts/{id}/quiz-results': {
      get: {
        tags: ['Posts'],
        summary: 'Voir les résultats d’un quiz',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Résultats quiz retournés' } },
      },
    },
    '/groups': {
      get: {
        tags: ['Groups'],
        summary: 'Lister les groupes',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Groupes listés' } },
      },
      post: {
        tags: ['Groups'],
        summary: 'Créer un groupe',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/GroupCreate' } },
          },
        },
        responses: { '201': { description: 'Groupe créé' } },
      },
    },
    '/groups/discover': {
      get: {
        tags: ['Groups'],
        summary: 'Découvrir des groupes',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Groupes découverts' } },
      },
    },
    '/groups/{id}': {
      get: {
        tags: ['Groups'],
        summary: 'Récupérer un groupe par ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Groupe retourné' } },
      },
      put: {
        tags: ['Groups'],
        summary: 'Modifier un groupe',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/GroupCreate' } },
          },
        },
        responses: { '200': { description: 'Groupe mis à jour' } },
      },
      delete: {
        tags: ['Groups'],
        summary: 'Supprimer un groupe',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Groupe supprimé' } },
      },
    },
    '/groups/{id}/members': {
      get: {
        tags: ['Groups'],
        summary: 'Lister les membres d’un groupe',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Membres listés' } },
      },
      post: {
        tags: ['Groups'],
        summary: 'Ajouter un membre à un groupe',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/GroupMemberCreate' } },
          },
        },
        responses: { '201': { description: 'Membre ajouté' } },
      },
    },
    '/groups/{id}/members/{userId}': {
      delete: {
        tags: ['Groups'],
        summary: 'Retirer un membre d’un groupe',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Membre retiré' } },
      },
    },
    '/groups/{id}/leave': {
      post: {
        tags: ['Groups'],
        summary: 'Quitter un groupe',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Groupe quitté' } },
      },
    },
    '/groups/{id}/members/{userId}/role': {
      put: {
        tags: ['Groups'],
        summary: 'Changer le rôle d’un membre de groupe',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role_in_group: { type: 'string' },
                },
                required: ['role_in_group'],
              },
            },
          },
        },
        responses: { '200': { description: 'Rôle du membre mis à jour' } },
      },
    },
    '/messages/conversations': {
      get: {
        tags: ['Messages'],
        summary: 'Lister les conversations',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Conversations listées' } },
      },
    },
    '/messages/unread-count': {
      get: {
        tags: ['Messages'],
        summary: 'Récupérer le nombre de messages non lus',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Nombre retourné' } },
      },
    },
    '/messages/{conversationId}': {
      get: {
        tags: ['Messages'],
        summary: 'Lister les messages d’une conversation',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Messages retournés' } },
      },
    },
    '/messages': {
      post: {
        tags: ['Messages'],
        summary: 'Envoyer un message privé ou de groupe',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageCreate' } },
          },
        },
        responses: { '201': { description: 'Message envoyé' } },
      },
    },
    '/messages/{id}/read': {
      put: {
        tags: ['Messages'],
        summary: 'Marquer un message comme lu',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Message marqué comme lu' } },
      },
    },
    '/messages/conversations/{conversationId}/read-all': {
      put: {
        tags: ['Messages'],
        summary: 'Marquer une conversation comme lue',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Conversation marquée comme lue' } },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Lister les notifications',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Notifications retournées' } },
      },
    },
    '/notifications/{id}/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Marquer une notification comme lue',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Notification marquée comme lue' } },
      },
    },
    '/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        summary: 'Marquer toutes les notifications comme lues',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Toutes les notifications marquées comme lues' } },
      },
    },
    '/notifications/{id}': {
      delete: {
        tags: ['Notifications'],
        summary: 'Supprimer une notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Notification supprimée' } },
      },
    },
    '/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Nombre de notifications non lues',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Nombre non lus retourné' } },
      },
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Recherche globale',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Résultats de recherche' } },
      },
    },
    '/search/users': {
      get: {
        tags: ['Search'],
        summary: 'Recherche d’utilisateurs',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Utilisateurs trouvés' } },
      },
    },
    '/search/groups': {
      get: {
        tags: ['Search'],
        summary: 'Recherche de groupes',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Groupes trouvés' } },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Statistiques globales',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Statistiques retournées' } },
      },
    },
    '/admin/stats/growth': {
      get: {
        tags: ['Admin'],
        summary: 'Croissance des inscriptions',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Croissance retournée' } },
      },
    },
    '/admin/logs': {
      get: {
        tags: ['Admin'],
        summary: 'Journaux rôle/modération',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Logs retournés' } },
      },
    },
    '/media/{id}': {
      get: {
        tags: ['Media'],
        summary: 'Consulter un média',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Média retourné' } },
      },
      delete: {
        tags: ['Media'],
        summary: 'Supprimer un média',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Média supprimé' } },
      },
    },
    '/site/content': {
      get: {
        tags: ['Site'],
        summary: 'Récupérer le contenu CMS',
        responses: { '200': { description: 'Contenu renvoyé' } },
      },
      put: {
        tags: ['Site'],
        summary: 'Mettre à jour le contenu CMS',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Contenu mis à jour' } },
      },
    },
    '/site/upload': {
      post: {
        tags: ['Site'],
        summary: 'Uploader un fichier pour le site',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: { '201': { description: 'Fichier uploadé' } },
      },
    },
    '/logs/api': {
      get: {
        tags: ['Logs'],
        summary: 'Voir les logs d’audit en JSON',
        responses: { '200': { description: 'Logs JSON retournés' } },
      },
    },
    '/logs/export': {
      get: {
        tags: ['Logs'],
        summary: 'Exporter les logs',
        responses: { '200': { description: 'Export de logs' } },
      },
    },
    '/logs': {
      get: {
        tags: ['Logs'],
        summary: 'Page publique de consultation des logs',
        responses: { '200': { description: 'Page des logs affichée' } },
      },
    },
    '/stories': {
      get: {
        tags: ['Stories'],
        summary: 'Lister le feed des stories',
        description: 'Endpoint conceptuel pour la fonctionnalité Stories. Les routes Stories sont documentées mais peuvent ne pas être implémentées dans la version actuelle.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Stories listées' } },
      },
      post: {
        tags: ['Stories'],
        summary: 'Créer une story',
        description: 'Endpoint conceptuel pour créer une story',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/StoryCreate' } },
          },
        },
        responses: { '201': { description: 'Story créée' } },
      },
    },
    '/stories/{id}': {
      get: {
        tags: ['Stories'],
        summary: 'Consulter une story',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Story retournée' } },
      },
      delete: {
        tags: ['Stories'],
        summary: 'Supprimer une story',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Story supprimée' } },
      },
    },
    '/stories/{id}/view': {
      post: {
        tags: ['Stories'],
        summary: 'Marquer une story comme vue',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Story marquée comme vue' } },
      },
    },
    '/stories/{id}/viewers': {
      get: {
        tags: ['Stories'],
        summary: 'Voir les utilisateurs ayant vu une story',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Liste des viewers retournée' } },
      },
    },
    '/stories/user/{userId}': {
      get: {
        tags: ['Stories'],
        summary: 'Lister les stories d’un utilisateur',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Stories utilisateur retournées' } },
      },
    },
  },
};

module.exports = openapi;
