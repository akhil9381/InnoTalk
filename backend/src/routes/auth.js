const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { generateTokens, authenticate, verifyRefreshToken, loginRateLimit, registerRateLimit } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional(),
  profile: Joi.object({
    persona: Joi.string().valid('aspiring-founder', 'intrapreneur', 'student-innovator', 'serial-entrepreneur').optional(),
    experience: Joi.string().valid('student', '0-2', '3-5', '6-10', '10+').optional(),
    industry: Joi.string().valid(
      'technology', 'healthcare', 'fintech', 'edtech', 'ecommerce',
      'manufacturing', 'agriculture', 'renewable-energy', 'biotech',
      'ai-ml', 'blockchain', 'iot', 'other'
    ).optional(),
    location: Joi.object({
      city: Joi.string().optional(),
      state: Joi.string().optional(),
    }).optional(),
  }).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

// Register new user
router.post('/register', registerRateLimit, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const { firstName, lastName, email, password, phone, profile } = value;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists',
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      profile: {
        ...profile,
        location: {
          ...profile?.location,
          country: 'India',
        },
      },
    });

    await user.save();

    // Generate email verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.security.emailVerificationToken = verificationToken;
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration',
    });
  }
});

// Login user
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const { email, password } = value;

    // Find user with password
    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        error: 'Account locked',
        message: 'Account has been locked due to multiple failed login attempts. Please try again later.',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login',
    });
  }
});

// Refresh access token
router.post('/refresh', verifyRefreshToken, async (req, res) => {
  try {
    const { accessToken, refreshToken } = generateTokens(req.user._id);

    logger.info(`Token refreshed for user: ${req.user.email}`);

    res.json({
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing the token',
    });
  }
});

// Logout user (client-side token invalidation)
router.post('/logout', authenticate, async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user.email}`);
    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout',
    });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Email verification token is required',
      });
    }

    const user = await User.findOne({ 'security.emailVerificationToken': token });
    if (!user) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'The verification token is invalid or has expired',
      });
    }

    user.security.emailVerified = true;
    user.security.emailVerificationToken = undefined;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      error: 'Email verification failed',
      message: 'An error occurred during email verification',
    });
  }
});

// Resend verification email
router.post('/resend-verification', authenticate, async (req, res) => {
  try {
    if (req.user.security.emailVerified) {
      return res.status(400).json({
        error: 'Email already verified',
        message: 'Your email has already been verified',
      });
    }

    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    req.user.security.emailVerificationToken = verificationToken;
    await req.user.save();

    await sendVerificationEmail(req.user.email, verificationToken);

    logger.info(`Verification email resent to: ${req.user.email}`);

    res.json({
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Failed to resend verification email',
      message: 'An error occurred while sending the verification email',
    });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const { email } = value;
    const user = await User.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'If an account with this email exists, a password reset link has been sent',
      });
    }

    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.security.passwordResetToken = resetToken;
    user.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    logger.info(`Password reset email sent to: ${email}`);

    res.json({
      message: 'If an account with this email exists, a password reset link has been sent',
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      message: 'An error occurred while processing your request',
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const { token, password } = value;

    const user = await User.findOne({
      'security.passwordResetToken': token,
      'security.passwordResetExpires': { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'The password reset token is invalid or has expired',
      });
    }

    user.password = password;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    user.security.loginAttempts = 0;
    user.security.lockUntil = undefined;
    await user.save();

    logger.info(`Password reset completed for user: ${user.email}`);

    res.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'An error occurred while resetting the password',
    });
  }
});

// Change password (authenticated user)
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const { currentPassword, newPassword } = value;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Invalid current password',
        message: 'The current password you entered is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'An error occurred while changing the password',
    });
  }
});

// Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      message: 'An error occurred while fetching user information',
    });
  }
});

module.exports = router;
