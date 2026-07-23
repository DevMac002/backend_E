const express = require('express');
const swaggerUi = require('swagger-ui-express');

const router = express.Router();

const serverUrl = process.env.BASE_URL
  || process.env.RENDER_EXTERNAL_URL
  || 'https://backend-e-m9ec.onrender.com';

const jsonResponse = {
  description: 'Réponse JSON',
  content: {
    'application/json': {
      schema: { type: 'object', additionalProperties: true },
    },
  },
};

const messageResponse = {
  description: 'Message de confirmation ou erreur',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/MessageResponse' },
    },
  },
};

function errorResponse(description, example) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        ...(example ? { example: { message: example } } : {}),
      },
    },
  };
}

const rateLimitResponse = errorResponse('Trop de requêtes, réessayez plus tard', 'Too Many Requests');

function authOperation(tag, summary, options = {}) {
  return {
    tags: [tag],
    summary,
    security: [{ bearerAuth: [] }],
    parameters: options.parameters || [],
    requestBody: options.requestBody,
    responses: options.responses || {
      200: jsonResponse,
      401: messageResponse,
      403: messageResponse,
      500: messageResponse,
    },
  };
}

function publicOperation(tag, summary, options = {}) {
  return {
    tags: [tag],
    summary,
    parameters: options.parameters || [],
    requestBody: options.requestBody,
    responses: options.responses || {
      200: jsonResponse,
      400: messageResponse,
      500: messageResponse,
    },
  };
}

const idParam = (name = 'id', description = 'Identifiant') => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer' },
});

const qParam = {
  name: 'q',
  in: 'query',
  required: false,
  description: 'Recherche texte',
  schema: { type: 'string' },
};

const paginationParams = [
  { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1 } },
  { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1 } },
];

const jsonBody = (schema) => ({
  required: true,
  content: {
    'application/json': { schema },
  },
});

const multipartFileBody = (properties = {}) => ({
  required: false,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        properties: {
          ...properties,
          file: { type: 'string', format: 'binary' },
        },
      },
    },
  },
});

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Epika Social API',
    version: '1.0.0',
    description: 'API documentation for Epika Social backend',
  },
  servers: [{ url: serverUrl }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Posts' },
    { name: 'Groups' },
    { name: 'Messages' },
    { name: 'Notifications' },
    { name: 'Search' },
    { name: 'Admin' },
    { name: 'Media' },
    { name: 'Logs' },
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
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', description: 'Description précise de l\'erreur' },
          error: { type: 'string', description: 'Détail technique (uniquement en développement)' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          user: { $ref: '#/components/schemas/UserProfile' },
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
          is_verified: { type: 'boolean' },
          avatar_path: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          foi_points: { type: 'integer' },
        },
      },
      NotificationItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          type: { type: 'string' },
          content: { type: 'string' },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedNotifications: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/NotificationItem' },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              pages: { type: 'integer' },
            },
          },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['username', 'email', 'password', 'device'],
        properties: {
          username: { type: 'string', example: 'john_doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', format: 'password', example: 'StrongPass1!' },
          device: { type: 'string', example: 'iphone-15' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password', 'device'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          device: { type: 'string' },
        },
      },
      OtpInput: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string', example: '123456' },
        },
      },
      RefreshInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      PostInput: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          type: { type: 'string', enum: ['post', 'annonce', 'sondage', 'quiz', 'predication'] },
          visible_to: { type: 'string', example: 'all' },
          options: { type: 'array', items: { type: 'string' } },
          reponse_correcte: { type: 'string' },
          quiz_type: { type: 'string', enum: ['true_false', 'single_choice', 'multiple_choice'], description: 'Requis pour un nouveau quiz' },
          choices: {
            type: 'array',
            minItems: 2,
            maxItems: 20,
            items: { type: 'object', required: ['id', 'label'], properties: { id: { type: 'string', example: 'a' }, label: { type: 'string', example: 'Une proposition' } } },
          },
          correct_answers: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Identifiants des bonnes réponses' },
          max_selections: { type: 'integer', minimum: 1, description: 'Nombre maximal de choix possibles pour une réponse multiple' },
          date_limite: { type: 'string', format: 'date-time' },
        },
      },
      GroupInput: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          description: { type: 'string' },
          is_private: { type: 'boolean' },
        },
      },
      MessageInput: {
        type: 'object',
        properties: {
          group_id: { type: 'integer' },
          receiver_id: { type: 'integer' },
          content: { type: 'string' },
          media_path: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: publicOperation('Health', 'Vérifier que le service est en ligne', {
        responses: { 200: jsonResponse },
      }),
    },
    '/auth/register': {
      post: publicOperation('Auth', 'Créer un compte', {
        requestBody: jsonBody({ $ref: '#/components/schemas/RegisterInput' }),
        responses: {
          201: { description: 'Compte créé avec succès', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, user: { $ref: '#/components/schemas/UserProfile' } } } } } },
          400: errorResponse('Données de validation invalides', 'Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial'),
          409: errorResponse('Conflit — email ou nom d\'utilisateur déjà pris', 'Cet email est déjà utilisé par un autre compte'),
          429: rateLimitResponse,
          500: errorResponse('Erreur serveur', 'Erreur serveur lors de l\'inscription'),
        },
      }),
    },
    '/auth/login': {
      post: publicOperation('Auth', 'Se connecter', {
        requestBody: jsonBody({ $ref: '#/components/schemas/LoginInput' }),
        responses: {
          200: { description: 'Connexion réussie', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
          400: errorResponse('Champ manquant', 'Le champ device est obligatoire'),
          401: errorResponse('Authentification échouée', 'Mot de passe incorrect'),
          403: errorResponse('Compte inaccessible', 'Votre compte a été banni. Contactez le support pour plus d\'informations.'),
          404: errorResponse('Compte inexistant', 'Aucun compte associé à cet email'),
          429: rateLimitResponse,
          500: errorResponse('Erreur serveur', 'Erreur serveur lors de la connexion'),
        },
      }),
    },
    '/auth/send-verification-code': {
      post: publicOperation('Auth', 'Envoyer un code de vérification email', {
        requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }),
        responses: {
          200: messageResponse,
          400: errorResponse('Email manquant ou compte déjà vérifié', 'Compte déjà vérifié'),
          404: errorResponse('Utilisateur introuvable', 'Utilisateur introuvable'),
          429: rateLimitResponse,
          500: errorResponse('Erreur d\'envoi', 'Échec de l\'envoi du code de vérification'),
        },
      }),
    },
    '/auth/verify-email': {
      post: publicOperation('Auth', 'Vérifier un email avec OTP', {
        requestBody: jsonBody({ $ref: '#/components/schemas/OtpInput' }),
        responses: {
          200: { description: 'Email vérifié, tokens fournis', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
          400: errorResponse('Données manquantes ou compte déjà vérifié', 'Email et code requis'),
          401: errorResponse('Code invalide', 'Code invalide'),
          403: errorResponse('Trop de tentatives', 'Trop de tentatives. Demandez un nouveau code.'),
          404: errorResponse('Utilisateur introuvable', 'Utilisateur introuvable'),
          410: errorResponse('Code expiré', 'Code expiré. Demandez un nouveau code.'),
          429: rateLimitResponse,
          500: errorResponse('Erreur serveur', 'Erreur serveur lors de la vérification de l\'email'),
        },
      }),
    },
    '/auth/forgot-password': {
      post: publicOperation('Auth', 'Demander un code de réinitialisation', {
        requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }),
        responses: {
          200: messageResponse,
          400: errorResponse('Email invalide', 'Email invalide'),
          429: rateLimitResponse,
          500: errorResponse('Erreur serveur', 'Erreur serveur lors de la demande de réinitialisation'),
        },
      }),
    },
    '/auth/reset-password': {
      post: publicOperation('Auth', 'Réinitialiser le mot de passe', {
        requestBody: jsonBody({
          type: 'object',
          required: ['email', 'code', 'newPassword'],
          properties: {
            email: { type: 'string', format: 'email' },
            code: { type: 'string' },
            newPassword: { type: 'string', format: 'password' },
          },
        }),
        responses: {
          200: messageResponse,
          400: errorResponse('Données invalides', 'Le mot de passe doit contenir au moins 8 caractères'),
          401: errorResponse('Code invalide', 'Code invalide'),
          403: errorResponse('Trop de tentatives', 'Trop de tentatives. Demandez un nouveau code.'),
          404: errorResponse('Utilisateur introuvable', 'Utilisateur introuvable'),
          410: errorResponse('Code expiré', 'Code expiré. Demandez un nouveau code.'),
          429: rateLimitResponse,
          500: errorResponse('Erreur serveur', 'Erreur serveur lors de la réinitialisation du mot de passe'),
        },
      }),
    },
    '/auth/change-password': {
      post: authOperation('Auth', 'Changer le mot de passe', {
        requestBody: jsonBody({
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', format: 'password' },
            newPassword: { type: 'string', format: 'password' },
          },
        }),
        responses: {
          200: messageResponse,
          400: errorResponse('Nouveau mot de passe invalide', 'Le mot de passe doit contenir au moins 8 caractères'),
          401: errorResponse('Mot de passe actuel incorrect', 'Mot de passe actuel invalide'),
          500: errorResponse('Erreur serveur', 'Erreur serveur lors du changement de mot de passe'),
        },
      }),
    },
    '/auth/refresh': {
      post: publicOperation('Auth', 'Rafraîchir un access token', {
        requestBody: jsonBody({ $ref: '#/components/schemas/RefreshInput' }),
        responses: {
          200: { description: 'Nouveau token d\'accès', content: { 'application/json': { schema: { type: 'object', properties: { accessToken: { type: 'string' } } } } } },
          401: errorResponse('Token invalide ou manquant', 'Refresh token manquant'),
          403: errorResponse('Utilisateur inaccessible', 'Utilisateur inaccessible'),
        },
      }),
    },
    '/auth/logout': {
      post: publicOperation('Auth', 'Déconnexion côté client'),
    },
    '/users/me': {
      get: authOperation('Users', 'Récupérer mon profil', {
        responses: {
          200: { description: 'Profil utilisateur', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
          401: errorResponse('Non authentifié', 'Token manquant ou invalide'),
          403: errorResponse('Compte banni', 'Votre compte est banni'),
        },
      }),
      put: authOperation('Users', 'Mettre à jour mon profil', {
        requestBody: jsonBody({ type: 'object', properties: { username: { type: 'string', minLength: 3, maxLength: 30 }, bio: { type: 'string', maxLength: 500 } } }),
        responses: {
          200: { description: 'Profil mis à jour', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
          400: errorResponse('Données invalides', 'Le nom d\'utilisateur doit contenir entre 3 et 30 caractères'),
          409: errorResponse('Nom d\'utilisateur déjà utilisé', 'Ce nom d\'utilisateur est déjà utilisé'),
          500: errorResponse('Erreur serveur', 'Erreur serveur lors de la mise à jour du profil'),
        },
      }),
      delete: authOperation('Users', 'Supprimer mon compte', {
        responses: {
          200: messageResponse,
          500: errorResponse('Erreur serveur', 'Erreur serveur lors de la suppression du compte'),
        },
      }),
    },
    '/users/me/avatar': {
      post: authOperation('Users', 'Uploader mon avatar', {
        requestBody: multipartFileBody(),
        responses: {
          200: { description: 'Avatar téléversé', content: { 'application/json': { schema: { type: 'object', properties: { avatar_path: { type: 'string' } } } } } },
          400: errorResponse('Fichier invalide', 'Format de fichier non supporté. Utilisez JPEG, PNG, WEBP, GIF.'),
          500: errorResponse('Erreur serveur', 'Erreur serveur lors du téléversement de l\'avatar'),
        },
      }),
    },
    '/users/me/change-email': {
      post: authOperation('Users', 'Modifier mon email et lancer sa vérification', {
        requestBody: jsonBody({ type: 'object', required: ['email', 'currentPassword'], properties: { email: { type: 'string', format: 'email' }, currentPassword: { type: 'string', format: 'password' } } }),
        responses: {
          200: messageResponse,
          400: errorResponse('Données manquantes', 'Email et mot de passe actuel requis'),
          401: errorResponse('Mot de passe invalide', 'Mot de passe actuel invalide'),
          409: errorResponse('Email déjà utilisé', 'Cet email est déjà utilisé'),
          502: errorResponse('Échec envoi email', 'Email modifié, mais le code de vérification n\'a pas pu être envoyé'),
        },
      }),
    },
    '/users/me/devices': {
      get: authOperation('Users', 'Lister mes appareils connectés'),
    },
    '/users/me/devices/{sessionId}': {
      delete: authOperation('Users', 'Déconnecter un de mes appareils', {
        parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: messageResponse,
          404: errorResponse('Appareil introuvable', 'Appareil introuvable'),
        },
      }),
    },
    '/users/leaderboard/foi': {
      get: authOperation('Users', 'Classement Foi'),
    },
    '/users/logs/roles': {
      get: authOperation('Users', 'Historique des changements de rôles'),
    },
    '/users': {
      get: authOperation('Users', 'Lister les utilisateurs admin'),
    },
    '/users/{id}': {
      get: authOperation('Users', 'Voir un profil public', { parameters: [idParam()] }),
    },
    '/users/{id}/rewards': {
      get: authOperation('Users', 'Voir les récompenses Foi', { parameters: [idParam()] }),
    },
    '/users/{id}/devices': {
      get: authOperation('Users', 'Lister les appareils d’un utilisateur gérable', { parameters: [idParam()] }),
    },
    '/users/{id}/role': {
      put: authOperation('Users', 'Changer le rôle communautaire utilisateur (admin ou superadmin)', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['peuple', 'constellation', 'tornades', 'tour', 'batview'] } } }) }),
    },
    '/users/{id}/status': {
      put: authOperation('Users', 'Attribuer ou retirer les droits d’administration (superadmin)', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['user', 'admin'] } } }) }),
    },
    '/users/{id}/ban': {
      put: authOperation('Users', 'Bannir ou débannir un utilisateur', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', properties: { ban: { type: 'boolean', default: true } } }) }),
    },
    '/users/{id}/temporary-block': {
      put: authOperation('Users', 'Bloquer temporairement un utilisateur ou lever le blocage', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['until'], properties: { until: { type: 'string', format: 'date-time', nullable: true, description: 'Date de fin; null pour lever le blocage' }, reason: { type: 'string' } } }) }),
    },
    '/users/{id}/restrictions': {
      put: authOperation('Users', 'Restreindre les accès utilisateur', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['restrictions'], properties: { restrictions: { type: 'object', properties: { posts: { type: 'boolean' }, comments: { type: 'boolean' }, messages: { type: 'boolean' }, groups: { type: 'boolean' } } }, reason: { type: 'string' } } }) }),
    },
    '/users/{id}/reward': {
      post: authOperation('Users', 'Attribuer des points Foi', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['montant'], properties: { montant: { type: 'integer', minimum: 1 }, motif: { type: 'string' } } }) }),
    },
    '/users/{id}/admin': {
      delete: authOperation('Users', 'Supprimer définitivement un compte gérable (admin ou superadmin)', { parameters: [idParam()] }),
    },
    '/posts': {
      get: authOperation('Posts', 'Lister le feed', { parameters: [...paginationParams, qParam] }),
      post: authOperation('Posts', 'Créer une publication ou un quiz', {
        requestBody: multipartFileBody({ content: { type: 'string' }, type: { type: 'string' }, quiz_type: { type: 'string', enum: ['true_false', 'single_choice', 'multiple_choice'] }, choices: { type: 'string', description: 'Tableau JSON de choix pour un envoi multipart' }, correct_answers: { type: 'string', description: 'Tableau JSON des identifiants corrects' }, max_selections: { type: 'integer', minimum: 1 } }),
        responses: {
          201: jsonResponse,
          400: errorResponse('Données invalides', 'Le contenu du post ne peut pas être vide (texte ou média requis)'),
          403: errorResponse('Accès refusé', 'Seuls les admins peuvent créer ce type de post'),
          429: rateLimitResponse,
          500: errorResponse('Erreur serveur', 'Erreur serveur lors de la création du post'),
        },
      }),
    },
    '/posts/predications': {
      get: authOperation('Posts', 'Lister prédications, annonces, sondages et quiz', { parameters: [...paginationParams, qParam] }),
    },
    '/posts/{id}': {
      get: authOperation('Posts', 'Voir une publication', {
        parameters: [idParam()],
        responses: {
          200: jsonResponse,
          404: errorResponse('Post introuvable', 'Post introuvable'),
        },
      }),
      put: authOperation('Posts', 'Modifier une publication', {
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/PostInput' }),
        responses: {
          200: jsonResponse,
          400: errorResponse('Données invalides', 'La question du quiz est obligatoire'),
          403: errorResponse('Accès refusé', 'Accès refusé'),
          404: errorResponse('Post introuvable', 'Post introuvable'),
        },
      }),
      delete: authOperation('Posts', 'Supprimer une publication', {
        parameters: [idParam()],
        responses: {
          200: messageResponse,
          403: errorResponse('Accès refusé', 'Accès refusé'),
          404: errorResponse('Post introuvable', 'Post introuvable'),
        },
      }),
    },
    '/posts/{id}/like': {
      post: authOperation('Posts', 'Aimer une publication', {
        parameters: [idParam()],
        responses: {
          200: messageResponse,
          404: errorResponse('Post introuvable', 'Post introuvable'),
          409: errorResponse('Déjà liké', 'Vous avez déjà liké ce post'),
        },
      }),
      delete: authOperation('Posts', 'Retirer un like', {
        parameters: [idParam()],
        responses: {
          200: messageResponse,
          404: errorResponse('Post introuvable', 'Post introuvable'),
        },
      }),
    },
    '/posts/{id}/likes': {
      get: authOperation('Posts', 'Lister les likes', { parameters: [idParam()] }),
    },
    '/posts/{id}/comments': {
      get: authOperation('Posts', 'Lister les commentaires', { parameters: [idParam()] }),
      post: authOperation('Posts', 'Ajouter un commentaire', {
        parameters: [idParam()],
        requestBody: jsonBody({ type: 'object', required: ['content'], properties: { content: { type: 'string', maxLength: 2000 } } }),
        responses: {
          201: jsonResponse,
          400: errorResponse('Contenu invalide', 'Le contenu du commentaire est obligatoire'),
          404: errorResponse('Post introuvable', 'Post introuvable'),
        },
      }),
    },
    '/posts/{id}/comments/{commentId}': {
      delete: authOperation('Posts', 'Supprimer un commentaire', {
        parameters: [idParam(), idParam('commentId', 'Identifiant du commentaire')],
        responses: {
          200: messageResponse,
          403: errorResponse('Accès refusé', 'Accès refusé'),
          404: errorResponse('Commentaire introuvable', 'Commentaire introuvable'),
        },
      }),
    },
    '/posts/{id}/vote': {
      post: authOperation('Posts', 'Voter à un sondage', {
        parameters: [idParam()],
        requestBody: jsonBody({ type: 'object', required: ['option_index'], properties: { option_index: { type: 'integer', minimum: 0 } } }),
        responses: {
          200: jsonResponse,
          400: errorResponse('Index invalide', 'L\'index de l\'option de vote est requis et doit être un entier positif'),
          404: errorResponse('Sondage introuvable', 'Sondage introuvable'),
          409: errorResponse('Déjà voté', 'Vous avez déjà voté à ce sondage'),
        },
      }),
    },
    '/posts/{id}/results': {
      get: authOperation('Posts', 'Résultats de sondage', { parameters: [idParam()] }),
    },
    '/posts/{id}/answer': {
      post: authOperation('Posts', 'Répondre à un quiz', {
        parameters: [idParam()],
        requestBody: jsonBody({ type: 'object', required: ['answers'], properties: { answers: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Un identifiant pour un choix unique/vrai-faux, plusieurs pour un choix multiple' } } }),
        responses: {
          200: { description: 'Résultat de la réponse', content: { 'application/json': { schema: { type: 'object', properties: { correct: { type: 'boolean' }, answers: { type: 'array', items: { type: 'string' } }, answer: { type: 'string' } } } } } },
          400: errorResponse('Réponse invalide', 'Sélectionnez au moins une réponse'),
          404: errorResponse('Quiz introuvable', 'Quiz introuvable'),
          409: errorResponse('Déjà répondu', 'Vous avez déjà répondu à ce quiz'),
        },
      }),
    },
    '/posts/{id}/quiz-results': {
      get: authOperation('Posts', 'Résultats de quiz', {
        parameters: [idParam()],
        responses: {
          200: jsonResponse,
          403: errorResponse('Accès refusé', 'Seul l\'auteur ou un admin peut voir les résultats détaillés'),
          404: errorResponse('Quiz introuvable', 'Quiz introuvable'),
        },
      }),
    },
    '/groups': {
      get: authOperation('Groups', 'Lister mes groupes'),
      post: authOperation('Groups', 'Créer un groupe', { requestBody: jsonBody({ $ref: '#/components/schemas/GroupInput' }) }),
    },
    '/groups/discover': {
      get: authOperation('Groups', 'Découvrir des groupes publics'),
    },
    '/groups/{id}': {
      get: authOperation('Groups', 'Voir un groupe', { parameters: [idParam()] }),
      put: authOperation('Groups', 'Modifier un groupe', { parameters: [idParam()], requestBody: jsonBody({ $ref: '#/components/schemas/GroupInput' }) }),
      delete: authOperation('Groups', 'Supprimer un groupe', { parameters: [idParam()] }),
    },
    '/groups/{id}/members': {
      get: authOperation('Groups', 'Lister les membres', { parameters: [idParam()] }),
      post: authOperation('Groups', 'Ajouter un membre', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['user_id'], properties: { user_id: { type: 'integer' } } }) }),
    },
    '/groups/{id}/members/{userId}': {
      delete: authOperation('Groups', 'Retirer un membre', { parameters: [idParam(), idParam('userId', 'Identifiant utilisateur')] }),
    },
    '/groups/{id}/leave': {
      post: authOperation('Groups', 'Quitter un groupe', { parameters: [idParam()] }),
    },
    '/groups/{id}/members/{userId}/role': {
      put: authOperation('Groups', 'Changer le rôle dans un groupe', { parameters: [idParam(), idParam('userId', 'Identifiant utilisateur')], requestBody: jsonBody({ type: 'object', properties: { role: { type: 'string' } } }) }),
    },
    '/messages/conversations': {
      get: authOperation('Messages', 'Lister les conversations'),
    },
    '/messages/unread-count': {
      get: authOperation('Messages', 'Nombre de messages non lus'),
    },
    '/messages/{conversationId}': {
      get: authOperation('Messages', 'Lister les messages d’un groupe ou d’une conversation privée', { parameters: [idParam('conversationId', 'Identifiant du groupe ou de l’autre utilisateur')] }),
    },
    '/messages': {
      post: authOperation('Messages', 'Créer un message', { requestBody: jsonBody({ $ref: '#/components/schemas/MessageInput' }) }),
    },
    '/messages/{id}/read': {
      put: authOperation('Messages', 'Marquer un message comme lu', { parameters: [idParam()] }),
    },
    '/messages/conversations/{conversationId}/read-all': {
      put: authOperation('Messages', 'Marquer une conversation comme lue', { parameters: [idParam('conversationId', 'Identifiant de conversation')] }),
    },
    '/notifications': {
      get: authOperation('Notifications', 'Lister mes notifications', {
        parameters: paginationParams,
        responses: {
          200: {
            description: 'Liste paginée de notifications',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedNotifications' },
              },
            },
          },
          401: messageResponse,
          403: messageResponse,
          500: messageResponse,
        },
      }),
    },
    '/notifications/unread-count': {
      get: authOperation('Notifications', 'Nombre de notifications non lues'),
    },
    '/notifications/{id}/read': {
      put: authOperation('Notifications', 'Marquer une notification comme lue', { parameters: [idParam()] }),
    },
    '/notifications/read-all': {
      put: authOperation('Notifications', 'Marquer toutes les notifications comme lues'),
    },
    '/notifications/{id}': {
      delete: authOperation('Notifications', 'Supprimer une notification', { parameters: [idParam()] }),
    },
    '/search': {
      get: authOperation('Search', 'Recherche globale', { parameters: [qParam] }),
    },
    '/search/users': {
      get: authOperation('Search', 'Recherche utilisateurs', { parameters: [qParam] }),
    },
    '/search/groups': {
      get: authOperation('Search', 'Recherche groupes', { parameters: [qParam] }),
    },
    '/admin/stats': {
      get: authOperation('Admin', 'Statistiques admin'),
    },
    '/admin/stats/growth': {
      get: authOperation('Admin', 'Croissance utilisateurs'),
    },
    '/admin/logs': {
      get: authOperation('Admin', 'Logs admin'),
    },
    '/media/{id}': {
      get: publicOperation('Media', 'Récupérer un média', {
        parameters: [idParam()],
        responses: {
          200: { description: 'Fichier média' },
          404: messageResponse,
        },
      }),
      delete: authOperation('Media', 'Supprimer un média', { parameters: [idParam()] }),
    },
    '/logs/api': {
      get: authOperation('Logs', 'Consulter le journal d’audit (admin ou superadmin)', { parameters: [...paginationParams, { name: 'user_id', in: 'query', schema: { type: 'integer' } }, { name: 'path', in: 'query', schema: { type: 'string' } }] }),
    },
  },
};

router.get('/openapi.json', (_req, res) => res.json(openApiSpec));
router.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));

module.exports = router;
