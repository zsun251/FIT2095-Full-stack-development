# CloudKitchen Pro

A full-stack recipe and kitchen-inventory management system with AI-assisted features, built with **Angular**, **Express**, and **MongoDB**.

## Features

- **Recipes**: create, view, edit, and delete recipes with ingredients, instructions, cuisine, difficulty, and prep time
- **Inventory**: track ingredients with quantity, unit, cost, location, and expiry date
- **Authentication and roles**: registration and login with role-based access control (`admin`, `chef`, `manager`), enforced by Angular route guards and Express middleware
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
│   ├── middleware/           Session user and role-based access control
│   ├── models/               Mongoose schemas (User, Recipe, UserInventory)
│   ├── routes/               API routes
│   └── services/             Gemini, Translation, Text-to-Speech
└── cloudkitchen/             Angular frontend
    └── src/app/
        ├── core/             Services, guards, HTTP interceptor
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

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB running locally (or a MongoDB Atlas connection string)
- A Google Gemini API key and a Google Cloud API key with Translation and Text-to-Speech enabled (only needed for the AI features)

### 1. Build the frontend

```bash
cd cloudkitchen
npm install
npm run build
```

### 2. Configure and start the backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in your API keys
npm start
```

Open http://localhost:3000. The backend serves the built Angular app and the API from the same port.

The API keys are optional. Without them the app runs normally, and only the AI analysis, translation, and text-to-speech features return an error.

### 3. Try it

1. Register an account. Choose a role (`chef`, `manager`, or `admin`), and note the input rules:
   - Phone numbers use the Australian format, for example `+61 412 345 678`
   - Passwords need at least 8 characters, including an uppercase letter, a lowercase letter, a number, and a special character
2. Log in, add a few inventory items and recipes, then open the dashboard.
3. With API keys configured, open a recipe to run the AI health analysis, translate it, or generate audio of its instructions.

## Author

Zhan Sun
