const express = require('express');
const Joi = require('joi');
const EvaluationState = require('../models/EvaluationState');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const syncSchema = Joi.object({
  sessions: Joi.array().items(Joi.object().unknown(true)).required(),
  activeSessionId: Joi.string().allow(null, '').optional(),
});

router.get('/', authenticate, authorize('user', 'admin', 'partner'), async (req, res) => {
  try {
    const state = await EvaluationState.findOne({ user: req.user._id }).lean();

    res.json({
      data: {
        sessions: state?.sessions || [],
        activeSessionId: state?.activeSessionId || null,
      },
    });
  } catch (error) {
    logger.error('Failed to load evaluation state:', error);
    res.status(500).json({
      error: 'Failed to load evaluations',
      message: 'An error occurred while loading saved startup sessions.',
    });
  }
});

router.put('/sync', authenticate, authorize('user', 'admin', 'partner'), async (req, res) => {
  try {
    const { error, value } = syncSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const state = await EvaluationState.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          sessions: value.sessions,
          activeSessionId: value.activeSessionId || null,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    res.json({
      message: 'Evaluation state synced successfully',
      data: {
        sessions: state.sessions || [],
        activeSessionId: state.activeSessionId || null,
      },
    });
  } catch (error) {
    logger.error('Failed to sync evaluation state:', error);
    res.status(500).json({
      error: 'Failed to sync evaluations',
      message: 'An error occurred while saving startup sessions.',
    });
  }
});

module.exports = router;
