# InnoTalk Architecture

## Overview

InnoTalk is designed as a social entrepreneurship and innovation simulation system. The product should help founders understand how their decisions would be viewed by investors, end beneficiaries, institutional adopters, government authorities, funders, and ecosystem partners.

The platform is built around dynamic scenarios, branching choices, live scoring, and AI-assisted feedback.

## 1. High-Level Architecture

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

## 2. Core Modules Breakdown

### A. Frontend

Primary pages:
- Landing Page: problem framing and simulation entry
- Simulation Interface: main interactive experience
- Dashboard: impact and score monitoring
- Summary Report Page: final review and report output

Frontend components:
- chat or scenario UI
- decision buttons and freeform input
- live metrics panel
- event notifications and crisis popups

Frontend state responsibilities:
- active simulation state
- decision history
- score visibility
- branching scenario context
- previous answer context for next question generation

Recommended state approach:
- Context API for current implementation
- Redux or Zustand if simulation complexity expands further

### B. Backend API Gateway

Responsibilities:
- validate incoming requests
- manage simulation lifecycle
- connect frontend actions to service layer
- return scenario, score, report, and next-step data

Suggested route surface:
- `POST /start-simulation`
- `POST /next-step`
- `GET /scenario`
- `GET /report`

Current repo already contains related backend route modules under:
- [`backend/src/routes`](/C:/Users/akhil/Desktop/InnoTalk/backend/src/routes)

### C. Simulation Engine

Responsibilities:
- control the overall flow of simulation
- decide which stakeholder or event appears next
- receive user decisions
- trigger score updates
- end the simulation and prepare summary output

Example flow:
1. user starts a simulation
2. first scenario is generated
3. user selects a decision path
4. AI and scoring evaluate the decision
5. next stakeholder event is generated
6. loop continues until summary or exit

Relevant current code:
- [`backend/src/services/simulationEngine.js`](/C:/Users/akhil/Desktop/InnoTalk/backend/src/services/simulationEngine.js)

### D. AI Decision Engine

Responsibilities:
- generate stakeholder-driven questions
- evaluate user decisions
- produce stakeholder reactions
- trigger new social-market challenges
- support dynamic branching from previous responses

Stakeholder perspectives should include:
- impact investor
- end beneficiary
- customer or institutional adopter
- government or policy authority
- funder or grantmaker
- community leader
- NGO or ecosystem partner

Prompt style should resemble:
- "You are a government officer evaluating a social innovation before public rollout."
- "You are an investor questioning whether this mission-driven model can remain sustainable."
- "You are a beneficiary institution reacting to whether this solution is practical."

Relevant current code:
- [`backend/src/services/geminiService.js`](/C:/Users/akhil/Desktop/InnoTalk/backend/src/services/geminiService.js)
- [`backend/src/services/aiAgents.js`](/C:/Users/akhil/Desktop/InnoTalk/backend/src/services/aiAgents.js)

### E. Scenario Manager

Responsibilities:
- hold predefined scenario templates
- support dynamic scenario generation
- vary difficulty and stakeholder lens
- introduce crisis events or resource shocks

Example scenario shape:

```json
{
  "scenario": "Funding shortage during a public-health pilot",
  "stakeholder": "Grant Committee",
  "options": [
    "Reduce rollout size",
    "Seek a strategic NGO partner",
    "Raise price for institutional users"
  ],
  "difficulty": "medium"
}
```

This module can begin as a template library and later become AI-first.

### F. Scoring Engine

Responsibilities:
- update live scores after each decision
- track tradeoffs, not just success
- explain why a score increased or decreased

Suggested score dimensions:
- impact score
- sustainability score
- risk score
- ethics score
- trust score
- policy readiness score

Example logic:

```text
if decision exploits workers:
  ethics -= 20
  sustainability -= 5
  short_term_profit += 15
```

Current repo already has related readiness scoring logic in:
- [`src/lib/evaluation.ts`](/C:/Users/akhil/Desktop/InnoTalk/src/lib/evaluation.ts)
- [`backend/src/services/vvsService.js`](/C:/Users/akhil/Desktop/InnoTalk/backend/src/services/vvsService.js)

### G. User Session Manager

Responsibilities:
- keep current scenario state
- store decision history
- track progress
- support backtracking
- allow alternate-path exploration

Current frontend session handling:
- [`src/context/EvaluationContext.tsx`](/C:/Users/akhil/Desktop/InnoTalk/src/context/EvaluationContext.tsx)

## 3. Database Design

### Users

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string"
}
```

### Sessions

```json
{
  "userId": "ObjectId",
  "currentScenario": "string",
  "scores": {
    "impact": 0,
    "sustainability": 0,
    "ethics": 0,
    "risk": 0
  },
  "history": []
}
```

### Logs

```json
{
  "time": "ISO timestamp",
  "query": "string",
  "log": "string",
  "createdAt": "ISO timestamp"
}
```

Current backend models already include:
- [`backend/src/models/User.js`](/C:/Users/akhil/Desktop/InnoTalk/backend/src/models/User.js)
- [`backend/src/models/Simulation.js`](/C:/Users/akhil/Desktop/InnoTalk/backend/src/models/Simulation.js)
- [`backend/src/models/Artifact.js`](/C:/Users/akhil/Desktop/InnoTalk/backend/src/models/Artifact.js)

## 4. Data Flow

### Simulation Loop

1. user clicks start
2. backend creates a session
3. first scenario is sent to frontend
4. user makes a decision
5. backend sends that decision to AI
6. backend updates scores
7. backend generates the next event
8. loop continues until simulation exit or completion

## 5. Example Flow

User says:
- "I want to build a rural education social venture"

System returns:
- scenario: funding shortage
- stakeholder view
- options shown

User selects:
- "Take investor funding"

AI responds:
- investor demands stronger financial discipline
- community trust concerns appear
- ethics score may drop
- sustainability score may rise

Next challenge is triggered:
- for example, a district education officer questions affordability and policy fit

## 6. Tech Stack

Frontend:
- React
- TypeScript
- Vite

Backend:
- Node.js
- Express

AI:
- Gemini API

Database:
- MongoDB

Optional:
- Socket.io for real-time event delivery

## 7. MVP vs Advanced Features

### MVP

- scenario-based simulation
- 3 to 5 strong stakeholder scenarios
- live score tracking
- AI-driven reactions
- summary report

### Advanced Features

- dashboard graphs
- multiple stakeholder roles in one round
- export report as PDF
- leaderboard
- crisis notifications
- cohort mode
- mentor override or review mode

## 8. How This Maps To The Current Repo

Already present:
- React frontend pages
- backend service layer
- Gemini-backed question generation
- MongoDB integration
- simulation and scoring foundations
- report and dashboard views

Still ideal to strengthen further:
- formal scenario-manager service
- explicit API gateway route naming for simulation lifecycle
- richer session persistence on the backend
- crisis event scheduler
- multiple simultaneous stakeholder reactions
- exportable PDF report flow from the frontend simulation path

## 9. Recommended Next Build Order

1. stabilize the simulation session API so frontend is backed by the backend session model
2. create a dedicated scenario manager with stored stakeholder and crisis templates
3. split scoring into explicit dimensions: impact, sustainability, ethics, risk
4. add dashboard graphing
5. add export report support
6. add real-time event delivery if needed
