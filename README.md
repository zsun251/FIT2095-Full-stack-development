# CloudKitchen Pro

A full-stack recipe and kitchen-inventory management system with AI-assisted features, built with **Angular**, **Express**, and **MongoDB**.

## Features

- **Recipes**: create, view, edit, and delete recipes with ingredients, instructions, cuisine, difficulty, and prep time
- **Inventory**: track ingredients with quantity, unit, cost, location, and expiry date
- **Authentication and roles**: registration and login with bcrypt-hashed passwords and JWT authentication; role-based access control (`admin`, `chef`, `manager`) is enforced by Express middleware on every API route and Socket.IO connection, and mirrored by Angular route guards
- **Dashboard**: statistics for recipes and inventory
- **AI health analysis**: Google Gemini reviews a recipe's ingredients and returns a nutrition and health assessment
- **Translation**: translate a recipe into other languages with Google Cloud Translation
- **Text-to-speech**: generate an audio version of a recipe's instructions with Google Cloud Text-to-Speech; progress is pushed to the client in real time over **Socket.IO**
- **PWA**: installable, with offline asset caching through Angular Service Worker

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 20 (standalone components), RxJS, Bootstrap 5, Angular Service Worker |
| Backend | Node.js, Express 5, REST API, Socket.IO |
| Database | MongoDB with Mongoose |
| AI / Cloud | Google Gemini, Google Cloud Translation, Google Cloud Text-to-Speech |

## Project structure

```
cloudkitchen-pro/
├── backend/                  Express REST API
│   ├── app.js                Server entry, routes, Socket.IO
│   ├── config/               MongoDB connection
│   ├── controllers/          Auth, recipe, and inventory logic
│   ├── middleware/           JWT authentication and role checks
│   ├── models/               Mongoose schemas (User, Recipe, UserInventory)
│   ├── routes/               API routes
│   └── services/             Gemini, Translation, Text-to-Speech
└── cloudkitchen/             Angular frontend
    └── src/app/
        ├── core/             Services, guards, HTTP interceptor (attaches the JWT)
        ├── features/         Auth, dashboard, recipes, inventory
        └── shared/           Header, footer, error page, models
```

## API overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET / POST | `/api/recipes` | List / create recipes |
| GET | `/api/recipes/my` | Recipes created by the current user |
| GET / PUT / DELETE | `/api/recipes/:recipeId` | Read / update / delete a recipe |
| POST | `/api/recipes/:recipeId/analyze-health` | AI health analysis |
| GET / POST | `/api/inventory` | List / add inventory items |
| GET / PUT / DELETE | `/api/inventory/:itemId` | Read / update / delete an item |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| POST | `/api/translation/recipe/:recipeId` | Translate a recipe |
| GET | `/api/translation/languages` | Supported languages |
| Socket.IO | `generate-speech` | Generate recipe audio |

Every endpoint except register, login, logout, and the language list needs an `Authorization: Bearer <token>` header with the token returned by login. Recipe, translation, and audio features are limited to the `chef` role, and chefs can only edit or delete their own recipes.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- MongoDB, either installed locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster. On macOS with Homebrew:
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```
- Optional: a Google Gemini API key and a Google Cloud API key with Translation and Text-to-Speech enabled, for the AI features

### 1. Clone the repository

```bash
git clone https://github.com/zsun251/FIT2095-Full-stack-development.git
cd FIT2095-Full-stack-development
```

All commands below start from the repository root.

### 2. Build the frontend

```bash
cd cloudkitchen
npm install
npm run build
cd ..
```

### 3. Configure the backend and load demo data

```bash
cd backend
npm install
cp .env.example .env   # set JWT_SECRET; API keys are optional
npm run seed
```

`npm run seed` creates a demo chef account with sample recipes and inventory items. It is safe to run again: it only replaces the demo account and its own data.

Set `JWT_SECRET` to any long random string (for example the output of `openssl rand -hex 32`). If it is empty, the server uses a random secret, so everyone is logged out when it restarts.

The API keys are optional. Without them the app runs normally, and only the AI analysis, translation, and text-to-speech features return an error. If you use MongoDB Atlas, set `MONGODB_URI` in `.env` to your connection string.

### 4. Start the server

```bash
npm start
```

Wait for `MongoDB Connected`, then open http://localhost:3000. The backend serves the built Angular app and the API from the same port. Keep this terminal open while you use the app.

### 5. Try it

1. Log in with the demo account: `chef@demo.com` / `Demo@1234`.
2. Browse the recipes and inventory, then open the dashboard.
3. With API keys configured, open a recipe to run the AI health analysis, translate it, or generate audio of its instructions.

To create your own account, register and note the input rules:

- Phone numbers use the Australian format, for example `+61 412 345 678`
- Passwords need at least 8 characters, including an uppercase letter, a lowercase letter, a number, and a special character

### Roles

| Role | Dashboard | Inventory | Recipes |
|---|---|---|---|
| `chef` | ✓ | ✓ | ✓ |
| `manager` | ✓ | ✓ | |
| `admin` | ✓ | ✓ | |

Choose `chef` to try every feature.

### Developing the frontend

To get live reload while editing Angular code, run the backend with `npm start` in `backend/`, then in a second terminal:

```bash
cd cloudkitchen
npm start
```

Open http://localhost:4200. The dev server proxies API, audio, and Socket.IO requests to the backend on port 3000 (see `proxy.conf.json`).

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `504 Gateway Timeout` or requests hang | The backend is not running. Start it with `npm start` in `backend/`. |
| `MongoDB connection error` on startup | MongoDB is not running. Start it (`brew services start mongodb-community`) or check `MONGODB_URI` in `.env`. |
| `EADDRINUSE: address already in use :::3000` | Another process is using port 3000. Stop it (`lsof -i :3000`, then `kill <PID>`), or set a different `PORT` in `.env`. |
| `404` on an API path that does not match the table above, or other stale behaviour | The browser is running an old cached build. Rebuild the frontend and hard-refresh (Cmd+Shift+R / Ctrl+Shift+R). |
| http://localhost:3000 shows an `ENOENT ... index.html` error | The frontend has not been built. Run `npm run build` in `cloudkitchen/`. |
| `bundle initial exceeded maximum budget` warning | Only a size warning from Angular. The build still succeeds and the app works. |

## Author

Zhan Sun
