const express = require('express');
const Joi = require('joi');
const Simulation = require('../models/Simulation');
const simulationEngine = require('../services/simulationEngine');
const { authenticate, requireSubscription, checkOwnership } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const createSimulationSchema = Joi.object({
  venture: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(1000).required(),
    industry: Joi.string().valid(
      'technology', 'healthcare', 'fintech', 'edtech', 'ecommerce',
      'manufacturing', 'agriculture', 'renewable-energy', 'biotech',
      'ai-ml', 'blockchain', 'iot', 'other'
    ).required(),
    targetMarket: Joi.object({
      geography: Joi.string().valid('local', 'regional', 'national', 'international').default('national'),
      segment: Joi.string(),
      size: Joi.string(),
    }).default(),
    businessModel: Joi.string().valid(
      'b2b', 'b2c', 'b2b2c', 'c2c', 'marketplace', 'subscription', 'freemium'
    ).default('b2c'),
  }).required(),
  settings: Joi.object({
    devilAdvocateMode: Joi.boolean().default(false),
    language: Joi.string().valid('english', 'telugu', 'hindi', 'tamil', 'kannada').default('english'),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').default('intermediate'),
    voiceMode: Joi.boolean().default(false),
  }).default(),
});

const responseSchema = Joi.object({
  response: Joi.string().min(10).max(2000).required(),
  additionalContext: Joi.object({
    question: Joi.string(),
    technicalRequirements: Joi.object(),
  }).default(),
});

// Create new simulation
router.post('/', authenticate, async (req, res) => {
  try {
    const { error, value } = createSimulationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    // Check subscription limits for devil's advocate mode
    if (value.settings.devilAdvocateMode && req.user.subscription.tier === 'free') {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'Devil\'s Advocate mode requires a Pro subscription',
      });
    }

    const simulation = await simulationEngine.createSimulation(
      req.user._id,
      value.venture,
      value.settings
    );

    logger.info(`Simulation created: ${simulation._id} by user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: simulation,
      message: 'Simulation created successfully',
    });
  } catch (error) {
    logger.error('Error creating simulation:', error);
    res.status(500).json({
      error: 'Failed to create simulation',
      message: error.message,
    });
  }
});

// Get user's simulations
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const options = {
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const simulations = await Simulation.findByUser(req.user._id, options)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Simulation.countDocuments({ 
      user: req.user._id,
      ...(status && { status })
    });

    res.json({
      success: true,
      data: {
        simulations,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting simulations:', error);
    res.status(500).json({
      error: 'Failed to get simulations',
      message: error.message,
    });
  }
});

// Get specific simulation
router.get('/:id', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulationState = await simulationEngine.getSimulationState(req.params.id);
    
    res.json({
      success: true,
      data: simulationState,
    });
  } catch (error) {
    logger.error('Error getting simulation:', error);
    res.status(500).json({
      error: 'Failed to get simulation',
      message: error.message,
    });
  }
});

// Submit response to current phase
router.post('/:id/response', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const { error, value } = responseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const result = await simulationEngine.processResponse(
      req.params.id,
      value.response,
      value.additionalContext
    );

    logger.info(`Response processed for simulation ${req.params.id}`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error processing response:', error);
    res.status(500).json({
      error: 'Failed to process response',
      message: error.message,
    });
  }
});

// Advance to next phase (if allowed)
router.post('/:id/advance', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    const canAdvance = await simulationEngine.canAdvancePhase(simulation);
    if (!canAdvance) {
      return res.status(400).json({
        error: 'Cannot advance phase',
        message: 'Current phase requirements not met',
      });
    }

    await simulationEngine.advancePhase(simulation);
    const updatedState = await simulationEngine.getSimulationState(req.params.id);

    logger.info(`Phase advanced for simulation ${req.params.id}`);

    res.json({
      success: true,
      data: updatedState,
      message: 'Advanced to next phase',
    });
  } catch (error) {
    logger.error('Error advancing phase:', error);
    res.status(500).json({
      error: 'Failed to advance phase',
      message: error.message,
    });
  }
});

// Pause simulation
router.post('/:id/pause', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await simulationEngine.pauseSimulation(req.params.id);
    
    res.json({
      success: true,
      data: simulation,
      message: 'Simulation paused',
    });
  } catch (error) {
    logger.error('Error pausing simulation:', error);
    res.status(500).json({
      error: 'Failed to pause simulation',
      message: error.message,
    });
  }
});

// Resume simulation
router.post('/:id/resume', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await simulationEngine.resumeSimulation(req.params.id);
    
    res.json({
      success: true,
      data: simulation,
      message: 'Simulation resumed',
    });
  } catch (error) {
    logger.error('Error resuming simulation:', error);
    res.status(500).json({
      error: 'Failed to resume simulation',
      message: error.message,
    });
  }
});

// Abandon simulation
router.post('/:id/abandon', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await simulationEngine.abandonSimulation(req.params.id);
    
    res.json({
      success: true,
      data: simulation,
      message: 'Simulation abandoned',
    });
  } catch (error) {
    logger.error('Error abandoning simulation:', error);
    res.status(500).json({
      error: 'Failed to abandon simulation',
      message: error.message,
    });
  }
});

// Get phase history
router.get('/:id/history', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    res.json({
      success: true,
      data: {
        phaseHistory: simulation.phaseHistory,
        totalPhases: simulation.phaseHistory.length,
        currentPhase: simulation.currentPhase,
      },
    });
  } catch (error) {
    logger.error('Error getting phase history:', error);
    res.status(500).json({
      error: 'Failed to get phase history',
      message: error.message,
    });
  }
});

// Get VVS score details
router.get('/:id/vvs', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    res.json({
      success: true,
      data: {
        vvsScore: simulation.vvsScore,
        trajectory: simulation.vvsScore.trajectory,
        dimensionBreakdown: simulation.vvsScore.dimensions,
        antiFragility: simulation.vvsScore.antiFragility,
      },
    });
  } catch (error) {
    logger.error('Error getting VVS score:', error);
    res.status(500).json({
      error: 'Failed to get VVS score',
      message: error.message,
    });
  }
});

// Get insights from simulation
router.get('/:id/insights', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    const allInsights = [];
    simulation.phaseHistory.forEach(phase => {
      phase.insights.forEach(insight => {
        allInsights.push({
          ...insight,
          phase: phase.phase,
          phaseName: simulationEngine.phaseConfig[phase.phase]?.name || 'Unknown',
        });
      });
    });

    // Group insights by type
    const insightsByType = allInsights.reduce((acc, insight) => {
      if (!acc[insight.type]) {
        acc[insight.type] = [];
      }
      acc[insight.type].push(insight);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        insights: allInsights,
        insightsByType,
        totalInsights: allInsights.length,
      },
    });
  } catch (error) {
    logger.error('Error getting insights:', error);
    res.status(500).json({
      error: 'Failed to get insights',
      message: error.message,
    });
  }
});

// Get market data from simulation
router.get('/:id/market-data', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    res.json({
      success: true,
      data: simulation.marketData || {},
    });
  } catch (error) {
    logger.error('Error getting market data:', error);
    res.status(500).json({
      error: 'Failed to get market data',
      message: error.message,
    });
  }
});

// Get simulation analytics
router.get('/:id/analytics', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    // Calculate analytics
    const analytics = {
      totalDuration: simulation.phaseHistory.reduce((total, phase) => 
        total + (phase.duration || 0), 0
      ),
      averagePhaseDuration: simulation.phaseHistory.length > 0 
        ? simulation.phaseHistory.reduce((total, phase) => total + (phase.duration || 0), 0) / simulation.phaseHistory.length
        : 0,
      totalResponses: simulation.phaseHistory.reduce((total, phase) => 
        total + phase.responses.length, 0
      ),
      totalInsights: simulation.phaseHistory.reduce((total, phase) => 
        total + phase.insights.length, 0
      ),
      vvsProgression: simulation.vvsScore.trajectory,
      phaseCompletionRates: simulation.phaseHistory.map(phase => ({
        phase: phase.phase,
        phaseName: simulationEngine.phaseConfig[phase.phase]?.name || 'Unknown',
        duration: phase.duration,
        responseCount: phase.responses.length,
        insightCount: phase.insights.length,
        completed: !!phase.completedAt,
      })),
      biasAnalysis: simulation.biasAnalysis,
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error getting simulation analytics:', error);
    res.status(500).json({
      error: 'Failed to get simulation analytics',
      message: error.message,
    });
  }
});

// Delete simulation (only for abandoned/completed simulations)
router.delete('/:id', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    if (simulation.status === 'in-progress') {
      return res.status(400).json({
        error: 'Cannot delete active simulation',
        message: 'Please pause or complete the simulation before deleting',
      });
    }

    await Simulation.findByIdAndDelete(req.params.id);

    logger.info(`Simulation deleted: ${req.params.id} by user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Simulation deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting simulation:', error);
    res.status(500).json({
      error: 'Failed to delete simulation',
      message: error.message,
    });
  }
});

module.exports = router;
