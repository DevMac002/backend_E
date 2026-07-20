# Epika Social Web App

Frontend minimal pour Epika Social, construit avec React et Vite.

## Installation

```bash
cd web-app
npm install
```

## Démarrage

```bash
npm run dev
```

La web app démarre sur `http://localhost:4173`.

## Configuration

Créez un fichier `.env` dans `web-app` si nécessaire :

```env
VITE_API_URL=http://localhost:3000
```

Lorsque l’application est servie par le backend Express en production, le client utilise `/` par défaut et ne nécessite pas de `VITE_API_URL`.

## Fonctionnalités

- Authentification via JWT
- Fil d’actualité
- Profil utilisateur
- Groupes
- Messagerie privée
- Notifications
- Tableau de bord admin pour `admin` et `superadmin`
