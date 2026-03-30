// MongoDB initialization script
db = db.getSiblingDB('innotalk');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firstName', 'lastName', 'email', 'password'],
      properties: {
        firstName: { bsonType: 'string', minLength: 2, maxLength: 50 },
        lastName: { bsonType: 'string', minLength: 2, maxLength: 50 },
        email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        password: { bsonType: 'string', minLength: 8 },
        role: { enum: ['user', 'mentor', 'admin', 'partner'] },
        isActive: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('simulations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user', 'venture', 'currentPhase', 'status'],
      properties: {
        user: { bsonType: 'objectId' },
        venture: {
          bsonType: 'object',
          required: ['name', 'description', 'industry'],
          properties: {
            name: { bsonType: 'string', minLength: 2, maxLength: 100 },
            description: { bsonType: 'string', minLength: 10, maxLength: 1000 },
            industry: { enum: ['technology', 'healthcare', 'fintech', 'edtech', 'ecommerce', 'manufacturing', 'agriculture', 'renewable-energy', 'biotech', 'ai-ml', 'blockchain', 'iot', 'other'] }
          }
        },
        currentPhase: { bsonType: 'number', minimum: 0, maximum: 7.5 },
        status: { enum: ['created', 'in-progress', 'completed', 'abandoned', 'paused'] }
      }
    }
  }
});

db.createCollection('artifacts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['simulation', 'user', 'type', 'title'],
      properties: {
        simulation: { bsonType: 'objectId' },
        user: { bsonType: 'objectId' },
        type: { enum: ['prd', 'pitch-deck', 'grant-prism', 'grant-sisfs', 'certificate', 'financial-model', 'regulatory-report'] },
        title: { bsonType: 'string', minLength: 1, maxLength: 200 },
        status: { enum: ['generating', 'ready', 'error', 'archived'] }
      }
    }
  }
});

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ 'subscription.tier': 1 });
db.users.createIndex({ 'stats.simulationsCompleted': -1 });

db.simulations.createIndex({ user: 1, status: 1 });
db.simulations.createIndex({ user: 1, createdAt: -1 });
db.simulations.createIndex({ 'venture.industry': 1 });
db.simulations.createIndex({ 'vvsScore.overall': -1 });
db.simulations.createIndex({ status: 1, createdAt: -1 });

db.artifacts.createIndex({ simulation: 1, type: 1 });
db.artifacts.createIndex({ user: 1, type: 1 });
db.artifacts.createIndex({ user: 1, createdAt: -1 });
db.artifacts.createIndex({ type: 1, status: 1 });
db.artifacts.createIndex({ 'sharing.shareToken': 1 });

// Create default admin user (if environment variables are set)
if (typeof ADMIN_EMAIL !== 'undefined' && typeof ADMIN_PASSWORD !== 'undefined') {
  db.users.insertOne({
    firstName: 'Admin',
    lastName: 'User',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD, // This should be hashed in the application
    role: 'admin',
    isActive: true,
    profile: {
      bio: 'Default administrator',
      location: { city: 'Hyderabad', state: 'Telangana', country: 'India' }
    },
    subscription: {
      tier: 'enterprise',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    },
    stats: {
      simulationsCompleted: 0,
      totalSimulationTime: 0,
      averageVVS: 0,
      highestVVS: 0,
      artifactsGenerated: 0,
      mentorSessions: 0
    },
    badges: [],
    security: {
      lastLogin: new Date(),
      loginAttempts: 0,
      emailVerified: true,
      twoFactorEnabled: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

print('Database initialization completed successfully!');
