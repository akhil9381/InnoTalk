# InnoTalk Backend API

The backend powers InnoTalk's social entrepreneurship simulation flow, market-readiness evaluation, artifact generation, and Gemini-backed questioning.

## Features

- Express API for auth, simulations, AI, analytics, artifacts, ecosystem, and users
- Gemini-powered question generation and evaluation support
- MongoDB-backed persistence
- Market research through Google Search API
- Optional email delivery for auth flows

## Prerequisites

- Node.js 18 or higher
- MongoDB
- Gemini API key
- Google Search API key

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `backend/.env`
3. Add the required variables:
   ```env
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:8080
   MONGODB_URI=mongodb://localhost:27017/innotalk
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-refresh-secret
   JWT_REFRESH_EXPIRES_IN=30d
   BCRYPT_ROUNDS=12
   GEMINI_API_KEY=your-gemini-api-key
   GOOGLE_SEARCH_API_KEY=your-google-search-api-key
   GOOGLE_SEARCH_ENGINE_ID=your-google-search-engine-id
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

Optional email variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## Environment Variables

Required:

- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `BCRYPT_ROUNDS`
- `GEMINI_API_KEY`
- `GOOGLE_SEARCH_API_KEY`
- `GOOGLE_SEARCH_ENGINE_ID`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

Optional:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## Notes

- Redis is no longer required.
- Docker files are no longer part of this backend setup.
- Email is optional for local development.
