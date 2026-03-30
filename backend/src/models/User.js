const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false,
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[\d\s-()]+$/, 'Please enter a valid phone number'],
  },
  role: {
    type: String,
    enum: ['user', 'mentor', 'admin', 'partner'],
    default: 'user',
  },
  profile: {
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    location: {
      city: String,
      state: String,
      country: { type: String, default: 'India' },
    },
    linkedin: {
      type: String,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$/, 'Please enter a valid LinkedIn URL'],
    },
    experience: {
      type: String,
      enum: ['student', '0-2', '3-5', '6-10', '10+'],
      default: 'student',
    },
    industry: {
      type: String,
      enum: [
        'technology', 'healthcare', 'fintech', 'edtech', 'ecommerce',
        'manufacturing', 'agriculture', 'renewable-energy', 'biotech',
        'ai-ml', 'blockchain', 'iot', 'other'
      ],
    },
    persona: {
      type: String,
      enum: ['aspiring-founder', 'intrapreneur', 'student-innovator', 'serial-entrepreneur'],
    },
  },
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
  },
  preferences: {
    language: {
      type: String,
      enum: ['english', 'telugu', 'hindi', 'tamil', 'kannada'],
      default: 'english',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      mentor: { type: Boolean, default: true },
      updates: { type: Boolean, default: false },
    },
  },
  stats: {
    simulationsCompleted: { type: Number, default: 0 },
    totalSimulationTime: { type: Number, default: 0 }, // in minutes
    averageVVS: { type: Number, default: 0 },
    highestVVS: { type: Number, default: 0 },
    artifactsGenerated: { type: Number, default: 0 },
    mentorSessions: { type: Number, default: 0 },
  },
  badges: [{
    type: {
      type: String,
      enum: [
        'first-simulation', 'phase-7-completion', 'vvs-80', 'devil-advocate-survivor',
        'mentor-favorite', 'co-founder-match', 'regulatory-expert', 'financial-ninja',
        'bias-detector', 'cohort-leader', 'serial-learner', 'ecosystem-connector'
      ],
    },
    earnedAt: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed,
  }],
  security: {
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
  },
  mentorProfile: {
    expertise: [String],
    experience: String,
    company: String,
    designation: String,
    availableHours: { type: Number, default: 0 }, // per week
    rate: Number, // per hour
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    linkedInVerified: { type: Boolean, default: false },
    certifications: [String],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
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
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'profile.persona': 1 });
userSchema.index({ 'subscription.tier': 1 });
userSchema.index({ 'stats.simulationsCompleted': -1 });
userSchema.index({ 'stats.highestVVS': -1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.security.passwordResetToken;
  delete obj.security.passwordResetExpires;
  delete obj.security.emailVerificationToken;
  delete obj.security.twoFactorSecret;
  return obj;
};

userSchema.methods.incrementLoginAttempts = async function() {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 },
    });
  }

  const updates = { $inc: { 'security.loginAttempts': 1 } };
  if (this.security.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 },
    $set: { 'security.lastLogin': new Date() },
  });
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);
