# Epika Social Backend

Backend Node.js/Express pour Epika Social, avec Socket.IO, MariaDB via Sequelize, JWT, OTP email, médias stockés en base et documentation Swagger.

## Stack

- Node.js 18+
- Express
- Socket.IO
- Sequelize
- MariaDB
- JWT
- Multer + Sharp
- Nodemailer
- Helmet / CORS / express-rate-limit

## Structure

```text
src/
  config/
  controllers/
  middlewares/
  models/
  routes/
  utils/
migrations/
postman/
tests/
server.js
render.yaml
```

## Installation locale

```bash
npm install
cp .env.example .env
npm run dev
```

API locale :

```text
http://localhost:3000
```

Healthcheck :

```bash
curl http://localhost:3000/health
```

Réponse attendue :

```json
{ "status": "ok", "service": "epika-social" }
```

## Déploiement Render

Le projet inclut un Blueprint Render :

```text
render.yaml
```

Render doit lancer :

```bash
npm start
```

Voir [RENDER.md](./RENDER.md) pour les variables d'environnement et les détails Socket.IO.

## Variables principales

```env
NODE_ENV=production
DB_HOST=...
DB_PORT=3306
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_DIALECT=mariadb
DB_SSL=false
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

## Documentation API

Swagger :

```text
/docs
```

Postman :

```text
postman/epika-social-full-api.postman_collection.json
```
