# Deploy on Render

This backend runs on Render as a Node.js Web Service with Express and Socket.IO.

## Service settings

Render can use the included `render.yaml` Blueprint.

Manual settings:

```text
Runtime: Node
Build Command: npm ci
Start Command: npm start
Health Check Path: /health
```

`npm start` runs `node server.js`, which starts Express and Socket.IO.

## Required environment variables

Render provides `PORT` automatically. The app listens on `0.0.0.0:${PORT}`.

Set these values in Render:

```env
NODE_ENV=production
DB_HOST=...
DB_PORT=3306
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_DIALECT=mariadb
DB_SSL=false
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
```

If your MariaDB provider requires TLS, set:

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

Only use `DB_SSL_REJECT_UNAUTHORIZED=false` when your provider requires it.

## Email variables

For OTP and password reset emails:

```env
SMTP_HOST=...
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

## Realtime

Socket.IO is served by the same Render Web Service.

Client example:

```js
io('https://your-service.onrender.com', {
  auth: { token: accessToken },
  transports: ['websocket'],
});
```

Render supports WebSocket connections on Web Services. Avoid the Free instance type for serious realtime usage because free services can spin down when idle.

## Health check

Render checks:

```text
/health
```

This route does not require a database connection, so Render can confirm the Node service is alive even during a slow database cold start.
