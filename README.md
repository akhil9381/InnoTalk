<<<<<<< HEAD
# InnoTalk
=======
# InnoTalk

InnoTalk is a social entrepreneurship and innovation simulation platform. It helps founders explore realistic market situations, stakeholder reactions, policy risks, resource tradeoffs, and social-impact consequences through an AI-guided simulation workflow.

The current implementation includes:
- a React frontend with a dynamic multi-phase simulation flow
- a Node.js and Express backend
- MongoDB for persisted backend data
- Gemini-powered question generation and evaluation support
- local frontend session persistence for the market-readiness simulation
- an AI-powered reality engine layer with disruptions, mentor feedback, replay paths, and smart scorecards

## Run

Frontend:
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run lint`

Backend:
- `cd backend`
- `npm run dev`
- `npm run lint`
- `npm test -- --runInBand --passWithNoTests`

## Product Direction

The target product is not a generic startup evaluator. It is a social entrepreneurship simulation system where the founder faces:
- investor pressure
- end-beneficiary and customer reactions
- government and policy interference
- institutional and NGO adoption barriers
- ethics and sustainability tradeoffs
- crisis and resource allocation events

## High-Level Architecture

```text
Frontend (React)
      ↓
API Gateway (Node.js / Express)
      ↓
Core Services Layer
 ├── Simulation Engine
 ├── AI Decision Engine
 ├── Scenario Manager
 ├── Scoring Engine
 └── User Session Manager
      ↓
Database (MongoDB)
      ↓
External AI APIs (Gemini)
```

Detailed system notes live in [`ARCHITECTURE.md`](/C:/Users/akhil/Desktop/InnoTalk/ARCHITECTURE.md).

## Current Frontend Surface

Pages:
- Landing page
- Simulation interface
- Dashboard
- Results report

Key frontend responsibilities:
- collect founder and venture inputs
- render scenario-led questions and option choices
- show score and consequence feedback
- allow backtracking and alternate choice exploration
- surface summary scores and readiness outputs

## Current Backend Surface

Backend routes currently include:
- auth
- AI routes
- simulations
- analytics
- artifacts
- ecosystem
- users

The backend already contains service modules for:
- simulation orchestration
- Gemini question generation
- AI agent responses
- market research
- regulatory support
- financial stress testing
- bias detection
- artifact generation

## Core Experience Goals

The platform should support:
- dynamic social entrepreneurship scenarios
- stakeholder-led questioning
- branching options and consequence previews
- live scoring across multiple dimensions
- session-based progress tracking
- final summary and dashboard reporting
- disruption events such as policy changes, funding cuts, backlash, and viral growth
- stakeholder personalities across investor, government, community, and operator lenses
- short-term versus long-term consequence timelines
- failure replay, gamification, mentor guidance, and scenario customization
- pitch evaluator mode and judge-friendly demo paths such as jury mode

## Feature Targets

Must-have:
- simulation chat or scenario interface
- 3 to 5 meaningful market situations
- AI-generated stakeholder responses
- live score tracking
- summary report

Planned advanced features:
- dashboard graphs
- multiple stakeholder roles
- exportable report or PDF
- leaderboard or cohort comparison
- real-time notifications or crisis events

## Tech Stack

Frontend:
- React
- TypeScript
- Vite
- component library and utility styling already present in the repo

Backend:
- Node.js
- Express
- Joi validation

AI:
- Gemini API

Data:
- MongoDB
- Redis for cache and session-adjacent backend behavior

Optional future additions:
- Socket.io for real-time crisis events and live simulation feel

## Environment

Frontend:
- `VITE_API_BASE_URL`

Backend:
- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `MONGODB_URI`
- `REDIS_URL`
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

Optional backend env:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## Notes

- Email is optional in local development.
- Gemini is the active AI provider in the current implementation.
- Some older backend modules still reflect a larger historical simulation design; the architecture document below shows the intended consolidated direction for the product.
>>>>>>> main
