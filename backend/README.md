# InnoTalk Backend API

The backend API for InnoTalk Socratic Venture Sandbox - an AI-native platform that transforms entrepreneurial ideas into execution-ready ventures through 8-phase simulation.

## 🚀 Features

- **8-Phase Simulation Engine**: Market Confrontation → Bias Calibration → Problem Validation → Customer Discovery → Solution Architecture → Business Model Design → Go-to-Market Strategy → Risk & Resilience → Smart Report → Investor Panel
- **Multi-Agent AI System**: Finance Head, Tech Lead, Community Lead, VC Auditor, and Devil's Advocate agents
- **Verified Venture Score (VVS)**: 100-point scoring system across 6 dimensions
- **Market Grounding**: Real-time Google Search API integration for market data
- **Artifact Generation**: Auto-generated PRDs, Pitch Decks, Grant Applications (PRISM, SISFS)
- **Bias Detection**: Real-time cognitive bias identification and intervention
- **Regulatory Intelligence**: Industry-specific compliance requirements
- **Ecosystem Integration**: T-Hub, T-Works, and other startup ecosystem resources

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- MongoDB 4.4 or higher
- Redis 6.0 or higher
- Google Search API key
- Gemini API key
- OpenAI API key (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd innotalk2/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3001
   HOST=localhost

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/innotalk
   REDIS_URL=redis://localhost:6379

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-refresh-token-secret
   JWT_REFRESH_EXPIRES_IN=30d

   # AI Services
   GEMINI_API_KEY=your-gemini-api-key
   GOOGLE_SEARCH_API_KEY=your-google-search-api-key
   GOOGLE_SEARCH_ENGINE_ID=your-google-search-engine-id

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Create required directories**
   ```bash
   mkdir -p logs uploads/artifacts
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001`

## 📚 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "profile": {
    "persona": "aspiring-founder",
    "experience": "0-2",
    "industry": "technology"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Simulations

#### Create Simulation
```http
POST /api/simulations
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "venture": {
    "name": "My Startup",
    "description": "A revolutionary startup idea",
    "industry": "technology",
    "businessModel": "b2c"
  },
  "settings": {
    "devilAdvocateMode": false,
    "language": "english",
    "difficulty": "intermediate"
  }
}
```

#### Get Simulation
```http
GET /api/simulations/:id
Authorization: Bearer <access-token>
```

#### Submit Response
```http
POST /api/simulations/:id/response
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "response": "My detailed response to the agent's challenge",
  "additionalContext": {
    "question": "What is your market size?"
  }
}
```

### AI Agents

#### Get Agent Response
```http
POST /api/ai/agent-response
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "agentType": "financeHead",
  "userResponse": "My response",
  "context": {
    "phase": 1,
    "ventureContext": {
      "industry": "technology"
    }
  }
}
```

#### Generate Boardroom Discussion
```http
POST /api/ai/boardroom
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "userResponse": "My response",
  "context": {
    "phase": 1,
    "devilAdvocateMode": false,
    "ventureContext": {
      "industry": "technology"
    }
  }
}
```

### Artifacts

#### Generate Artifacts
```http
POST /api/artifacts/generate
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "simulationId": "simulation-id",
  "artifactTypes": ["prd", "pitch-deck"]
}
```

#### Get Artifacts
```http
GET /api/artifacts
Authorization: Bearer <access-token>
```

#### Download Artifact
```http
GET /api/artifacts/:id/download/:format
Authorization: Bearer <access-token>
```

### Analytics

#### Get User Analytics
```http
GET /api/analytics/user
Authorization: Bearer <access-token>
```

#### Get Platform Analytics (Admin)
```http
GET /api/analytics/platform
Authorization: Bearer <access-token>
```

### Ecosystem

#### Get Resources
```http
GET /api/ecosystem/resources
Authorization: Bearer <access-token>
```

#### Get Recommendations
```http
GET /api/ecosystem/recommendations
Authorization: Bearer <access-token>
```

## 🗄️ Database Schema

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String, // user, mentor, admin, partner
  profile: {
    bio: String,
    location: Object,
    experience: String,
    industry: String,
    persona: String
  },
  subscription: {
    tier: String, // free, pro, enterprise
    startDate: Date,
    endDate: Date
  },
  stats: {
    simulationsCompleted: Number,
    totalSimulationTime: Number,
    averageVVS: Number,
    highestVVS: Number
  },
  badges: Array
}
```

### Simulation Model
```javascript
{
  user: ObjectId,
  venture: {
    name: String,
    description: String,
    industry: String,
    businessModel: String
  },
  currentPhase: Number,
  phaseHistory: Array,
  vvsScore: {
    overall: Number,
    dimensions: Object,
    trajectory: Array
  },
  marketData: Object,
  financialModel: Object,
  regulatoryCompliance: Object,
  status: String,
  completionData: Object
}
```

### Artifact Model
```javascript
{
  simulation: ObjectId,
  user: ObjectId,
  type: String, // prd, pitch-deck, grant-prism, etc.
  title: String,
  content: {
    text: String,
    html: String,
    json: Object
  },
  files: Array,
  sharing: {
    isPublic: Boolean,
    shareToken: String,
    downloadCount: Number
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `GEMINI_API_KEY` | Gemini API key | Yes |
| `GOOGLE_SEARCH_API_KEY` | Google Search API key | Yes |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Search Engine ID | Yes |
| `SMTP_HOST` | Email SMTP host | Yes |
| `SMTP_USER` | Email SMTP user | Yes |
| `SMTP_PASS` | Email SMTP password | Yes |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

## 📦 Deployment

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t innotalk-backend .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Production Deployment

1. **Set production environment variables**
2. **Install dependencies**
   ```bash
   npm ci --only=production
   ```
3. **Run database migrations**
   ```bash
   npm run migrate
   ```
4. **Start the application**
   ```bash
   npm start
   ```

## 🔒 Security

- JWT-based authentication with refresh tokens
- Rate limiting on all endpoints
- Input validation with Joi
- Password hashing with bcrypt
- CORS configuration
- Helmet.js security headers
- Role-based access control

## 📊 Monitoring

- Winston logging with structured logs
- Request/response logging
- Error tracking
- Performance monitoring
- AI interaction logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

Confidential - Internal Use Only

## 🆘 Support

For support and questions, please contact the development team.

---

## 🚀 API Rate Limits

- **Authentication endpoints**: 5 requests per 15 minutes
- **General endpoints**: 100 requests per 15 minutes
- **AI endpoints**: 20 requests per minute (Pro/Enterprise)

## 📈 Performance

- **Target response time**: < 200ms for API calls
- **AI response time**: < 3 seconds
- **Concurrent users**: 10,000 (scaled)
- **Uptime SLA**: 99.5%

## 🔗 Integration APIs

- **Google Search API**: Market data grounding
- **Google Gemini**: AI agent responses
- **T-Hub API**: Incubator resources
- **T-Works API**: Hardware resources
- **Startup India API**: Grant information
- **LinkedIn API**: Profile integration
