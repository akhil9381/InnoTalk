const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  venture: {
    name: {
      type: String,
      required: [true, 'Venture name is required'],
      trim: true,
      maxlength: [100, 'Venture name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Venture description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: [
        'technology', 'healthcare', 'fintech', 'edtech', 'ecommerce',
        'manufacturing', 'agriculture', 'renewable-energy', 'biotech',
        'ai-ml', 'blockchain', 'iot', 'other'
      ],
    },
    targetMarket: {
      geography: {
        type: String,
        enum: ['local', 'regional', 'national', 'international'],
        default: 'national',
      },
      segment: String,
      size: String, // estimated market size
    },
    businessModel: {
      type: String,
      enum: ['b2b', 'b2c', 'b2b2c', 'c2c', 'marketplace', 'subscription', 'freemium'],
    },
  },
  currentPhase: {
    type: Number,
    min: 0,
    max: 7.5,
    default: 0,
  },
  phaseHistory: [{
    phase: {
      type: Number,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    duration: Number, // in minutes
    responses: [{
      question: String,
      answer: String,
      agent: String,
      timestamp: { type: Date, default: Date.now },
      evaluation: {
        score: Number,
        feedback: String,
        categories: [String],
      },
    }],
    insights: [{
      type: {
        type: String,
        enum: ['blindspot', 'perspective-shift', 'aha-moment', 'risk-identified', 'opportunity'],
      },
      description: String,
      timestamp: { type: Date, default: Date.now },
      agent: String,
    }],
    gatekeeperChallenge: {
      challenge: String,
      response: String,
      passed: Boolean,
      score: Number,
    },
  }],
  vvsScore: {
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    dimensions: {
      market: { type: Number, min: 0, max: 100, default: 0 },
      financial: { type: Number, min: 0, max: 100, default: 0 },
      technical: { type: Number, min: 0, max: 100, default: 0 },
      regulatory: { type: Number, min: 0, max: 100, default: 0 },
      team: { type: Number, min: 0, max: 100, default: 0 },
      execution: { type: Number, min: 0, max: 100, default: 0 },
    },
    trajectory: [{
      timestamp: { type: Date, default: Date.now },
      phase: Number,
      score: Number,
    }],
    antiFragility: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  biasAnalysis: {
    detectedBiases: [{
      type: {
        type: String,
        enum: [
          'confirmation-bias', 'optimism-bias', 'planning-fallacy',
          'curse-of-knowledge', 'availability-heuristic', 'anchoring-bias'
        ],
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
      description: String,
      intervention: String,
      timestamp: { type: Date, default: Date.now },
    }],
    overallBiasScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  agents: {
    financeHead: {
      personality: String,
      riskTolerance: {
        type: String,
        enum: ['conservative', 'moderate', 'aggressive'],
        default: 'moderate',
      },
      priorities: [String],
    },
    techLead: {
      personality: String,
      technicalFocus: [String],
      buildVsBuyPreference: {
        type: String,
        enum: ['build', 'buy', 'hybrid'],
        default: 'hybrid',
      },
    },
    communityLead: {
      personality: String,
      communityFocus: [String],
      trustBuildingStyle: String,
    },
    devilAdvocate: {
      enabled: { type: Boolean, default: false },
      intensity: {
        type: String,
        enum: ['mild', 'moderate', 'aggressive'],
        default: 'moderate',
      },
    },
    vcAuditor: {
      stance: String,
      focusAreas: [String],
    },
  },
  marketData: {
    trends: [{
      topic: String,
      trend: String,
      source: String,
      timestamp: Date,
      relevanceScore: Number,
    }],
    competitors: [{
      name: String,
      description: String,
      strengths: [String],
      weaknesses: [String],
      marketShare: Number,
    }],
    fundingRounds: [{
      company: String,
      amount: Number,
      stage: String,
      date: Date,
      investors: [String],
    }],
  },
  financialModel: {
    assumptions: {
      pricing: Number,
      marketSize: Number,
      cac: Number, // Customer Acquisition Cost
      ltv: Number, // Lifetime Value
      burnRate: Number,
      runway: Number,
    },
    projections: {
      revenue: [Number], // monthly projections for 24 months
      expenses: [Number],
      profit: [Number],
    },
    stressTests: [{
      scenario: String,
      description: String,
      impact: {
        revenue: Number,
        profit: Number,
        runway: Number,
      },
      passed: Boolean,
    }],
    breakEven: {
      months: Number,
      revenue: Number,
    },
  },
  regulatoryCompliance: {
    industry: String,
    requiredApprovals: [String],
    complianceStatus: {
      type: String,
      enum: ['not-started', 'in-progress', 'compliant', 'issues-identified'],
      default: 'not-started',
    },
    checklist: [{
      requirement: String,
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'blocked'],
        default: 'pending',
      },
      deadline: Date,
      documents: [String],
      notes: String,
    }],
    policyAlerts: [{
      title: String,
      description: String,
      effectiveDate: Date,
      impact: String,
      source: String,
    }],
  },
  artifacts: {
    prd: {
      generated: { type: Boolean, default: false },
      url: String,
      generatedAt: Date,
    },
    pitchDeck: {
      generated: { type: Boolean, default: false },
      url: String,
      generatedAt: Date,
    },
    grantApplications: [{
      type: {
        type: String,
        enum: ['prism', 'sisfs', 'other'],
      },
      generated: { type: Boolean, default: false },
      url: String,
      generatedAt: Date,
    }],
    certificate: {
      generated: { type: Boolean, default: false },
      url: String,
      qrCode: String,
      generatedAt: Date,
    },
  },
  settings: {
    devilAdvocateMode: { type: Boolean, default: false },
    language: {
      type: String,
      enum: ['english', 'telugu', 'hindi', 'tamil', 'kannada'],
      default: 'english',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    voiceMode: { type: Boolean, default: false },
  },
  status: {
    type: String,
    enum: ['created', 'in-progress', 'completed', 'abandoned', 'paused'],
    default: 'created',
  },
  completionData: {
    completedAt: Date,
    totalDuration: Number, // in minutes
    phasesCompleted: Number,
    finalVVS: Number,
    certificateIssued: { type: Boolean, default: false },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: String,
      wouldRecommend: Boolean,
    },
  },
  cohort: {
    id: String,
    benchmark: {
      vvsPercentile: Number,
      completionTimePercentile: Number,
      strengths: [String],
      improvements: [String],
    },
  },
  mentorSessions: [{
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionDate: Date,
    notes: String,
    rating: { type: Number, min: 1, max: 5 },
    artifacts: [String],
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtuals
simulationSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

simulationSchema.virtual('progress').get(function() {
  return (this.currentPhase / 7.5) * 100;
});

simulationSchema.virtual('currentPhaseName').get(function() {
  const phaseNames = {
    0: 'Market Confrontation',
    0.5: 'Bias Calibration Intake',
    1: 'Problem Validation',
    2: 'Customer Discovery',
    3: 'Solution Architecture',
    4: 'Business Model Design',
    5: 'Go-to-Market Strategy',
    6: 'Risk & Resilience',
    7: 'Smart Report',
    7.5: 'Investor Panel',
  };
  return phaseNames[this.currentPhase] || 'Unknown';
});

// Indexes
simulationSchema.index({ user: 1, status: 1 });
simulationSchema.index({ user: 1, createdAt: -1 });
simulationSchema.index({ 'venture.industry': 1 });
simulationSchema.index({ 'vvsScore.overall': -1 });
simulationSchema.index({ status: 1, createdAt: -1 });
simulationSchema.index({ 'cohort.id': 1 });

// Pre-save middleware
simulationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update phase history if current phase changed
  if (this.isModified('currentPhase')) {
    const currentPhaseHistory = this.phaseHistory.find(ph => ph.phase === this.currentPhase);
    if (!currentPhaseHistory) {
      this.phaseHistory.push({
        phase: this.currentPhase,
        startedAt: new Date(),
      });
    }
  }
  
  next();
});

// Instance methods
simulationSchema.methods.advancePhase = function() {
  const phases = [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 7.5];
  const currentIndex = phases.indexOf(this.currentPhase);
  
  if (currentIndex < phases.length - 1) {
    this.currentPhase = phases[currentIndex + 1];
    
    // Mark previous phase as completed
    const previousPhase = this.phaseHistory.find(ph => ph.phase === phases[currentIndex]);
    if (previousPhase && !previousPhase.completedAt) {
      previousPhase.completedAt = new Date();
      previousPhase.duration = Math.round((previousPhase.completedAt - previousPhase.startedAt) / (1000 * 60));
    }
    
    return true;
  }
  return false;
};

simulationSchema.methods.addResponse = function(phase, question, answer, agent, evaluation) {
  const phaseHistory = this.phaseHistory.find(ph => ph.phase === phase);
  if (phaseHistory) {
    phaseHistory.responses.push({
      question,
      answer,
      agent,
      evaluation,
    });
  }
};

simulationSchema.methods.addInsight = function(phase, type, description, agent) {
  const phaseHistory = this.phaseHistory.find(ph => ph.phase === phase);
  if (phaseHistory) {
    phaseHistory.insights.push({
      type,
      description,
      agent,
    });
  }
};

simulationSchema.methods.updateVVSScore = function(newScore, dimensionScores = {}) {
  const oldScore = this.vvsScore.overall;
  this.vvsScore.overall = newScore;
  
  // Update dimension scores if provided
  Object.keys(dimensionScores).forEach(dimension => {
    if (this.vvsScore.dimensions[dimension] !== undefined) {
      this.vvsScore.dimensions[dimension] = dimensionScores[dimension];
    }
  });
  
  // Add to trajectory
  this.vvsScore.trajectory.push({
    timestamp: new Date(),
    phase: this.currentPhase,
    score: newScore,
  });
  
  return newScore - oldScore;
};

// Static methods
simulationSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  if (options.status) {
    query.status = options.status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

simulationSchema.statics.findActiveSimulations = function() {
  return this.find({ status: 'in-progress' });
};

simulationSchema.statics.getCohortData = function(industry, experience) {
  return this.aggregate([
    { $match: { 'venture.industry': industry, status: 'completed' } },
    {
      $group: {
        _id: null,
        avgVVS: { $avg: '$vvsScore.overall' },
        avgDuration: { $avg: '$completionData.totalDuration' },
        totalSimulations: { $sum: 1 },
        vvsDistribution: {
          $push: '$vvsScore.overall',
        },
      },
    },
  ]);
};

module.exports = mongoose.model('Simulation', simulationSchema);
