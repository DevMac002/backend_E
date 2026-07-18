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
        responses: { 201: jsonResponse, 400: messageResponse, 409: messageResponse, 500: messageResponse },
      }),
    },
    '/auth/login': {
      post: publicOperation('Auth', 'Se connecter', {
        requestBody: jsonBody({ $ref: '#/components/schemas/LoginInput' }),
        responses: { 200: jsonResponse, 400: messageResponse, 401: messageResponse, 403: messageResponse, 500: messageResponse },
      }),
    },
    '/auth/send-verification-code': {
      post: publicOperation('Auth', 'Envoyer un code de vérification email', {
        requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }),
      }),
    },
    '/auth/verify-email': {
      post: publicOperation('Auth', 'Vérifier un email avec OTP', {
        requestBody: jsonBody({ $ref: '#/components/schemas/OtpInput' }),
      }),
    },
    '/auth/forgot-password': {
      post: publicOperation('Auth', 'Demander un code de réinitialisation', {
        requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }),
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
      }),
    },
    '/auth/refresh': {
      post: publicOperation('Auth', 'Rafraîchir un access token', {
        requestBody: jsonBody({ $ref: '#/components/schemas/RefreshInput' }),
      }),
    },
    '/auth/logout': {
      post: publicOperation('Auth', 'Déconnexion côté client'),
    },
    '/users/me': {
      get: authOperation('Users', 'Récupérer mon profil'),
      put: authOperation('Users', 'Mettre à jour mon profil', { requestBody: jsonBody({ type: 'object', additionalProperties: true }) }),
      delete: authOperation('Users', 'Supprimer mon compte'),
    },
    '/users/me/avatar': {
      post: authOperation('Users', 'Uploader mon avatar', { requestBody: multipartFileBody() }),
    },
    '/users/me/change-email': {
      post: authOperation('Users', 'Modifier mon email et lancer sa vérification', { requestBody: jsonBody({ type: 'object', required: ['email', 'currentPassword'], properties: { email: { type: 'string', format: 'email' }, currentPassword: { type: 'string', format: 'password' } } }) }),
    },
    '/users/me/devices': {
      get: authOperation('Users', 'Lister mes appareils connectés'),
    },
    '/users/me/devices/{sessionId}': {
      delete: authOperation('Users', 'Déconnecter un de mes appareils', { parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] }),
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
      post: authOperation('Posts', 'Créer une publication ou un quiz', { requestBody: multipartFileBody({ content: { type: 'string' }, type: { type: 'string' }, quiz_type: { type: 'string', enum: ['true_false', 'single_choice', 'multiple_choice'] }, choices: { type: 'string', description: 'Tableau JSON de choix pour un envoi multipart' }, correct_answers: { type: 'string', description: 'Tableau JSON des identifiants corrects' }, max_selections: { type: 'integer', minimum: 1 } }) }),
    },
    '/posts/predications': {
      get: authOperation('Posts', 'Lister prédications, annonces, sondages et quiz', { parameters: [...paginationParams, qParam] }),
    },
    '/posts/{id}': {
      get: authOperation('Posts', 'Voir une publication', { parameters: [idParam()] }),
      put: authOperation('Posts', 'Modifier une publication', { parameters: [idParam()], requestBody: jsonBody({ $ref: '#/components/schemas/PostInput' }) }),
      delete: authOperation('Posts', 'Supprimer une publication', { parameters: [idParam()] }),
    },
    '/posts/{id}/like': {
      post: authOperation('Posts', 'Aimer une publication', { parameters: [idParam()] }),
      delete: authOperation('Posts', 'Retirer un like', { parameters: [idParam()] }),
    },
    '/posts/{id}/likes': {
      get: authOperation('Posts', 'Lister les likes', { parameters: [idParam()] }),
    },
    '/posts/{id}/comments': {
      get: authOperation('Posts', 'Lister les commentaires', { parameters: [idParam()] }),
      post: authOperation('Posts', 'Ajouter un commentaire', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['content'], properties: { content: { type: 'string' } } }) }),
    },
    '/posts/{id}/comments/{commentId}': {
      delete: authOperation('Posts', 'Supprimer un commentaire', { parameters: [idParam(), idParam('commentId', 'Identifiant du commentaire')] }),
    },
    '/posts/{id}/vote': {
      post: authOperation('Posts', 'Voter à un sondage', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['option_index'], properties: { option_index: { type: 'integer' } } }) }),
    },
    '/posts/{id}/results': {
      get: authOperation('Posts', 'Résultats de sondage', { parameters: [idParam()] }),
    },
    '/posts/{id}/answer': {
      post: authOperation('Posts', 'Répondre à un quiz', { parameters: [idParam()], requestBody: jsonBody({ type: 'object', required: ['answers'], properties: { answers: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Un identifiant pour un choix unique/vrai-faux, plusieurs pour un choix multiple' } } }) }),
    },
    '/posts/{id}/quiz-results': {
      get: authOperation('Posts', 'Résultats de quiz', { parameters: [idParam()] }),
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
      get: authOperation('Notifications', 'Lister mes notifications', { parameters: paginationParams }),
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
      get: authOperation('Logs', 'Consulter le journal d’audit (superadmin)', { parameters: [...paginationParams, { name: 'user_id', in: 'query', schema: { type: 'integer' } }, { name: 'path', in: 'query', schema: { type: 'string' } }] }),
    },
  },
};

router.get('/openapi.json', (_req, res) => res.json(openApiSpec));
router.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));

module.exports = router;
