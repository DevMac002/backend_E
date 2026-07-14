# Deploy on Railway

This backend is ready to run on Railway as a long-lived Node.js service with Express and Socket.IO.

## Start command

Railway uses:

```bash
npm start
```

That runs `node server.js`, which starts the HTTP server and initializes Socket.IO.

## Required variables

Set these variables in Railway:

```env
NODE_ENV=production
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
BASE_URL=https://your-railway-domain
```

For the database, either set your usual variables:

```env
DB_HOST=...
DB_PORT=3306
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_DIALECT=mariadb
DB_SSL=false
```

Or connect a Railway MySQL/MariaDB service and expose its variables. The app can read:

```env
MYSQLHOST
MYSQLPORT
MYSQLDATABASE
MYSQLUSER
MYSQLPASSWORD
MYSQL_URL
```

Railway provides `PORT` automatically. Do not hard-code it in production.

## Realtime

Socket.IO is enabled through `server.js`, so clients should connect to the Railway domain:

```js
io('https://your-railway-domain', {
  auth: { token: accessToken },
  transports: ['websocket'],
});
```

## Health check

Railway is configured to check:

```text
/health
```
