const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Rate limiters for auth endpoints
const loginLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 5, // Number of requests
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

const registerLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 3, // Number of requests
  duration: 3600, // Per hour
  blockDuration: 3600, // Block for 1 hour
});

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

// Verify JWT token
const verifyToken = async (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token',
      });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found or inactive',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Authorization failed',
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

// Subscription tier authorization
const requireSubscription = (...tiers) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource',
      });
    }

    const userTier = req.user.subscription.tier;
    const hasValidTier = tiers.includes(userTier);
    
    if (!hasValidTier) {
      return res.status(403).json({
        error: 'Subscription required',
        message: `This feature requires a ${tiers.join(' or ')} subscription`,
        tier: userTier,
      });
    }

    // Check if subscription is active
    if (userTier !== 'free' && req.user.subscription.endDate) {
      const now = new Date();
      const endDate = new Date(req.user.subscription.endDate);
      
      if (endDate < now) {
        return res.status(403).json({
          error: 'Subscription expired',
          message: 'Your subscription has expired. Please renew to continue.',
        });
      }
    }

    next();
  };
};

// Rate limiting middleware for login
const loginRateLimit = async (req, res, next) => {
  try {
    await loginLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    
    return res.status(429).json({
      error: 'Too many login attempts',
      message: `Rate limit exceeded. Please try again in ${secs} seconds.`,
      retryAfter: secs,
    });
  }
};

// Rate limiting middleware for registration
const registerRateLimit = async (req, res, next) => {
  try {
    await registerLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    
    return res.status(429).json({
      error: 'Too many registration attempts',
      message: `Rate limit exceeded. Please try again in ${secs} seconds.`,
      retryAfter: secs,
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Optional auth, so we don't fail on error
    next();
  }
};

// Verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token type',
        message: 'Please provide a valid refresh token',
      });
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'User not found or inactive',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid refresh token',
      message: error.message,
    });
  }
};

// Resource ownership check
const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          error: 'Resource not found',
          message: 'The requested resource does not exist',
        });
      }

      // Check if user owns the resource or is admin/mentor
      const userId = req.user._id.toString();
      const resourceUserId = resource.user?.toString() || resource._id?.toString();
      
      if (resourceUserId !== userId && !['admin', 'mentor'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to access this resource',
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Ownership check failed',
        message: error.message,
      });
    }
  };
};

module.exports = {
  generateTokens,
  authenticate,
  authorize,
  requireSubscription,
  loginRateLimit,
  registerRateLimit,
  optionalAuth,
  verifyRefreshToken,
  checkOwnership,
};
