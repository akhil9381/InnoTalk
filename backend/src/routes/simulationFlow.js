const express = require('express');
const Joi = require('joi');
const Simulation = require('../models/Simulation');
const simulationEngine = require('../services/simulationEngine');
const {
  buildSimulationInput,
  buildScenarioPayload,
  buildReportPayload,
} = require('../services/simulationFlowService');
const { authenticate, checkOwnership } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const startSimulationSchema = Joi.object({
  startupName: Joi.string().min(2).max(100),
  sector: Joi.string().allow(''),
  geography: Joi.string().allow(''),
  stage: Joi.string().allow(''),
  mission: Joi.string().allow(''),
  problem: Joi.string().allow(''),
  beneficiaries: Joi.string().allow(''),
  solutionApproach: Joi.string().allow(''),
  operatingModel: Joi.string().allow(''),
  model: Joi.string().allow(''),
  marketSize: Joi.string().allow(''),
  devilAdvocateMode: Joi.boolean().default(false),
  language: Joi.string().valid('english', 'telugu', 'hindi', 'tamil', 'kannada').default('english'),
  venture: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(1000).required(),
    industry: Joi.string().required(),
    targetMarket: Joi.object({
      geography: Joi.string(),
      segment: Joi.string().allow(''),
      size: Joi.string().allow(''),
    }).default(),
    businessModel: Joi.string().allow(''),
  }),
  settings: Joi.object({
    devilAdvocateMode: Joi.boolean(),
    language: Joi.string().valid('english', 'telugu', 'hindi', 'tamil', 'kannada'),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    voiceMode: Joi.boolean(),
  }),
}).or('venture', 'startupName');

const nextStepSchema = Joi.object({
  sessionId: Joi.string().required(),
  decision: Joi.string().min(5).max(2000).required(),
  selectedOptionId: Joi.string().allow(''),
  stakeholder: Joi.string().allow(''),
  consequence: Joi.string().allow(''),
  question: Joi.string().allow(''),
});

router.post('/start-simulation', authenticate, async (req, res) => {
  try {
    const { error, value } = startSimulationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const simulationInput = buildSimulationInput(value);
    const simulation = await simulationEngine.createSimulation(
      req.user._id,
      simulationInput.venture,
      simulationInput.settings,
    );
    const hydratedSimulation = await Simulation.findById(simulation._id);

    res.status(201).json({
      success: true,
      data: {
        sessionId: simulation._id,
        scenario: await buildScenarioPayload(hydratedSimulation),
      },
      message: 'Simulation session started successfully',
    });
  } catch (error) {
    logger.error('Error starting simulation flow:', error);
    res.status(500).json({
      error: 'Failed to start simulation',
      message: error.message,
    });
  }
});

router.post('/next-step', authenticate, async (req, res) => {
  try {
    const { error, value } = nextStepSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    const simulation = await Simulation.findById(value.sessionId);
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
      });
    }

    const ownsSimulation = simulation.user.toString() === req.user._id.toString();
    if (!ownsSimulation && !['admin', 'mentor'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to update this session',
      });
    }

    const responseContext = {
      question: value.question || `Decision via ${value.stakeholder || 'stakeholder'} perspective`,
      technicalRequirements: {
        selectedOptionId: value.selectedOptionId,
        consequence: value.consequence,
      },
    };

    const result = await simulationEngine.processResponse(
      value.sessionId,
      value.decision,
      responseContext,
    );

    const updatedSimulation = await Simulation.findById(value.sessionId);

    res.json({
      success: true,
      data: {
        outcome: result,
        scenario: await buildScenarioPayload(updatedSimulation),
        reportPreview: await buildReportPayload(updatedSimulation),
      },
    });
  } catch (error) {
    logger.error('Error processing next simulation step:', error);
    res.status(500).json({
      error: 'Failed to process next step',
      message: error.message,
    });
  }
});

router.get('/scenario/:id', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);

    res.json({
      success: true,
      data: await buildScenarioPayload(simulation),
    });
  } catch (error) {
    logger.error('Error getting scenario payload:', error);
    res.status(500).json({
      error: 'Failed to get scenario',
      message: error.message,
    });
  }
});

router.get('/report/:id', authenticate, checkOwnership(Simulation, 'id'), async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id);

    res.json({
      success: true,
      data: await buildReportPayload(simulation),
    });
  } catch (error) {
    logger.error('Error getting simulation report:', error);
    res.status(500).json({
      error: 'Failed to get report',
      message: error.message,
    });
  }
});

module.exports = router;
