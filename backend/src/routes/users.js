const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional(),
  profile: Joi.object({
    bio: Joi.string().max(500).optional(),
    location: Joi.object({
      city: Joi.string().optional(),
      state: Joi.string().optional(),
    }).optional(),
    linkedin: Joi.string().uri().optional(),
    experience: Joi.string().valid('student', '0-2', '3-5', '6-10', '10+').optional(),
    industry: Joi.string().valid(
      'technology', 'healthcare', 'fintech', 'edtech', 'ecommerce',
      'manufacturing', 'agriculture', 'renewable-energy', 'biotech',
      'ai-ml', 'blockchain', 'iot', 'other'
    ).optional(),
    persona: Joi.string().valid('aspiring-founder', 'intrapreneur', 'student-innovator', 'serial-entrepreneur').optional(),
  }).optional(),
  preferences: Joi.object({
    language: Joi.string().valid('english', 'telugu', 'hindi', 'tamil', 'kannada').optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      mentor: Joi.boolean().optional(),
      updates: Joi.boolean().optional(),
    }).optional(),
  }).optional(),
});

const updateMentorProfileSchema = Joi.object({
  expertise: Joi.array().items(Joi.string()).required(),
  experience: Joi.string().required(),
  company: Joi.string().required(),
  designation: Joi.string().required(),
  availableHours: Joi.number().min(0).max(40).required(),
  rate: Joi.number().min(0).required(),
  certifications: Joi.array().items(Joi.string()).optional(),
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: user.toSafeObject(),
    });
  } catch (error) {
    logger.error('Error getting user profile:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error.message,
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Update allowed fields
    if (value.firstName) user.firstName = value.firstName;
    if (value.lastName) user.lastName = value.lastName;
    if (value.phone) user.phone = value.phone;
    
    if (value.profile) {
      user.profile = { ...user.profile, ...value.profile };
    }
    
    if (value.preferences) {
      user.preferences = { ...user.preferences, ...value.preferences };
    }

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    res.json({
      success: true,
      data: user.toSafeObject(),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message,
    });
  }
});

// Update mentor profile
router.put('/mentor-profile', authenticate, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const { error, value } = updateMentorProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    user.mentorProfile = {
      ...user.mentorProfile,
      ...value,
    };

    await user.save();

    logger.info(`Mentor profile updated: ${user.email}`);

    res.json({
      success: true,
      data: user.toSafeObject(),
      message: 'Mentor profile updated successfully',
    });
  } catch (error) {
    logger.error('Error updating mentor profile:', error);
    res.status(500).json({
      error: 'Failed to update mentor profile',
      message: error.message,
    });
  }
});

// Get user statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const stats = {
      simulations: {
        completed: user.stats.simulationsCompleted,
        totalTime: user.stats.totalSimulationTime,
        averageTime: user.stats.simulationsCompleted > 0 
          ? Math.round(user.stats.totalSimulationTime / user.stats.simulationsCompleted)
          : 0,
        averageVVS: user.stats.averageVVS,
        highestVVS: user.stats.highestVVS,
      },
      artifacts: {
        generated: user.stats.artifactsGenerated,
      },
      mentorSessions: {
        completed: user.stats.mentorSessions,
      },
      badges: {
        total: user.badges.length,
        recent: user.badges.slice(-5),
      },
      subscription: {
        tier: user.subscription.tier,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({
      error: 'Failed to get user statistics',
      message: error.message,
    });
  }
});

// Get user badges
router.get('/badges', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        badges: user.badges.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt)),
        totalBadges: user.badges.length,
      },
    });
  } catch (error) {
    logger.error('Error getting user badges:', error);
    res.status(500).json({
      error: 'Failed to get user badges',
      message: error.message,
    });
  }
});

// Search mentors (public endpoint)
router.get('/mentors', async (req, res) => {
  try {
    const { 
      expertise, 
      industry, 
      minRating = 0, 
      page = 1, 
      limit = 10 
    } = req.query;

    const query = { 
      role: 'mentor',
      isActive: true,
      'mentorProfile.rating': { $gte: parseFloat(minRating) },
    };

    if (expertise) {
      query['mentorProfile.expertise'] = { $in: [expertise] };
    }

    if (industry) {
      query['profile.industry'] = industry;
    }

    const mentors = await User.find(query)
      .select('firstName lastName email profile mentorProfile')
      .sort({ 'mentorProfile.rating': -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        mentors: mentors.map(mentor => mentor.toSafeObject()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Error searching mentors:', error);
    res.status(500).json({
      error: 'Failed to search mentors',
      message: error.message,
    });
  }
});

// Get mentor profile by ID
router.get('/mentors/:id', async (req, res) => {
  try {
    const mentor = await User.findOne({ 
      _id: req.params.id, 
      role: 'mentor', 
      isActive: true 
    }).select('firstName lastName email profile mentorProfile');

    if (!mentor) {
      return res.status(404).json({
        error: 'Mentor not found',
      });
    }

    res.json({
      success: true,
      data: mentor.toSafeObject(),
    });
  } catch (error) {
    logger.error('Error getting mentor profile:', error);
    res.status(500).json({
      error: 'Failed to get mentor profile',
      message: error.message,
    });
  }
});

// Admin: Get all users
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { 
      role, 
      status, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('firstName lastName email role profile stats subscription isActive createdAt')
      .sort(sort)
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toSafeObject()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: error.message,
    });
  }
});

// Admin: Update user role
router.put('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'mentor', 'admin', 'partner'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be one of: user, mentor, admin, partner',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    logger.info(`User role updated: ${user.email} to ${role}`);

    res.json({
      success: true,
      data: user.toSafeObject(),
      message: 'User role updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user role:', error);
    res.status(500).json({
      error: 'Failed to update user role',
      message: error.message,
    });
  }
});

// Admin: Deactivate/Activate user
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    user.isActive = isActive;
    await user.save();

    logger.info(`User status updated: ${user.email} to ${isActive ? 'active' : 'inactive'}`);

    res.json({
      success: true,
      data: user.toSafeObject(),
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    logger.error('Error updating user status:', error);
    res.status(500).json({
      error: 'Failed to update user status',
      message: error.message,
    });
  }
});

// Delete user account
router.delete('/account', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Soft delete by deactivating
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    logger.info(`User account deleted: ${user.email}`);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user account:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      message: error.message,
    });
  }
});

module.exports = router;
