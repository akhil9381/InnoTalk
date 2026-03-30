const mongoose = require('mongoose');

const artifactSchema = new mongoose.Schema({
  simulation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Simulation',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'prd', // Product Requirements Document
      'pitch-deck', // Investor Pitch Deck
      'grant-prism', // PRISM Grant Application
      'grant-sisfs', // SISFS Grant Application
      'certificate', // Founder Readiness Certificate
      'financial-model', // Financial projections
      'regulatory-report', // Compliance report
      'co-founder-brief', // Co-founder compatibility profile
      'mentor-report', // Mentor session summary
      'cohort-benchmark', // Benchmarking report
    ],
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  content: {
    // Raw content for different formats
    text: String, // Plain text version
    html: String, // HTML version
    markdown: String, // Markdown version
    json: mongoose.Schema.Types.Mixed, // Structured data
  },
  files: [{
    format: {
      type: String,
      enum: ['pdf', 'docx', 'pptx', 'xlsx', 'json'],
    },
    url: String,
    filename: String,
    size: Number, // in bytes
    generatedAt: { type: Date, default: Date.now },
  }],
  metadata: {
    template: String, // Template used
    version: { type: String, default: '1.0' },
    language: {
      type: String,
      enum: ['english', 'telugu', 'hindi', 'tamil', 'kannada'],
      default: 'english',
    },
    pageCount: Number, // for PDF/PPTX
    wordCount: Number, // for DOCX
    charts: [String], // List of chart URLs or data
    images: [String], // List of image URLs
    customFields: mongoose.Schema.Types.Mixed,
  },
  generation: {
    source: {
      type: String,
      enum: ['simulation-data', 'user-input', 'template', 'ai-generated'],
      default: 'simulation-data',
    },
    model: String, // AI model used for generation
    prompt: String, // Generation prompt
    tokens: Number, // Tokens used for generation
    duration: Number, // Generation time in ms
    quality: {
      score: { type: Number, min: 0, max: 100 },
      feedback: String,
    },
  },
  sharing: {
    isPublic: { type: Boolean, default: false },
    shareToken: String,
    shareUrl: String,
    expiresAt: Date,
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    permissions: {
      canView: { type: Boolean, default: true },
      canDownload: { type: Boolean, default: true },
      canShare: { type: Boolean, default: false },
    },
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comments: String,
    useful: Boolean,
    improvements: [String],
  },
  status: {
    type: String,
    enum: ['generating', 'ready', 'error', 'archived'],
    default: 'generating',
  },
  error: {
    message: String,
    code: String,
    timestamp: Date,
  },
  tags: [String],
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
artifactSchema.virtual('isReady').get(function() {
  return this.status === 'ready';
});

artifactSchema.virtual('hasFiles').get(function() {
  return this.files && this.files.length > 0;
});

artifactSchema.virtual('primaryFile').get(function() {
  return this.files && this.files.length > 0 ? this.files[0] : null;
});

// Indexes
artifactSchema.index({ simulation: 1, type: 1 });
artifactSchema.index({ user: 1, type: 1 });
artifactSchema.index({ user: 1, createdAt: -1 });
artifactSchema.index({ type: 1, status: 1 });
artifactSchema.index({ 'sharing.shareToken': 1 });
artifactSchema.index({ tags: 1 });

// Pre-save middleware
artifactSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
artifactSchema.methods.addFile = function(format, url, filename, size) {
  this.files.push({
    format,
    url,
    filename,
    size,
    generatedAt: new Date(),
  });
  
  if (this.status === 'generating') {
    this.status = 'ready';
  }
};

artifactSchema.methods.generateShareToken = function() {
  const crypto = require('crypto');
  this.sharing.shareToken = crypto.randomBytes(32).toString('hex');
  this.sharing.shareUrl = `${process.env.FRONTEND_URL}/shared/artifacts/${this.sharing.shareToken}`;
  this.sharing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  return this.sharing.shareToken;
};

artifactSchema.methods.incrementDownload = function() {
  this.sharing.downloadCount += 1;
  return this.save();
};

artifactSchema.methods.incrementView = function() {
  this.sharing.viewCount += 1;
  return this.save();
};

// Static methods
artifactSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  if (options.type) {
    query.type = options.type;
  }
  if (options.status) {
    query.status = options.status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

artifactSchema.statics.findBySimulation = function(simulationId) {
  return this.find({ simulation: simulationId }).sort({ createdAt: -1 });
};

artifactSchema.statics.findByShareToken = function(token) {
  return this.findOne({
    'sharing.shareToken': token,
    'sharing.expiresAt': { $gt: new Date() },
  });
};

artifactSchema.statics.getUsageStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalDownloads: { $sum: '$sharing.downloadCount' },
        avgRating: { $avg: '$feedback.rating' },
      },
    },
  ]);
};

module.exports = mongoose.model('Artifact', artifactSchema);
