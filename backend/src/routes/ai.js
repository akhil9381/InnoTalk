const express = require('express');
const Joi = require('joi');
const aiAgentService = require('../services/aiAgents');
const geminiService = require('../services/geminiService');
const { authenticate, requireSubscription } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const agentResponseSchema = Joi.object({
  agentType: Joi.string().valid('financeHead', 'techLead', 'communityLead', 'vcAuditor', 'devilAdvocate').required(),
  userResponse: Joi.string().min(10).max(2000).required(),
  context: Joi.object({
    phase: Joi.number().min(0).max(7.5),
    ventureContext: Joi.object({
      industry: Joi.string(),
      businessModel: Joi.string(),
      targetMarket: Joi.string(),
      customerSegment: Joi.string(),
    }),
    previousContext: Joi.object(),
    technicalRequirements: Joi.object(),
    marketData: Joi.object(),
    competitiveData: Joi.object(),
    failureCases: Joi.array(),
    industryFailures: Joi.object(),
  }).optional(),
});

const boardroomSchema = Joi.object({
  userResponse: Joi.string().min(10).max(2000).required(),
  context: Joi.object({
    phase: Joi.number().min(0).max(7.5),
    devilAdvocateMode: Joi.boolean().default(false),
    ventureContext: Joi.object({
      industry: Joi.string(),
      businessModel: Joi.string(),
      targetMarket: Joi.string(),
      customerSegment: Joi.string(),
    }),
    previousContext: Joi.object(),
    technicalRequirements: Joi.object(),
    marketData: Joi.object(),
    competitiveData: Joi.object(),
    failureCases: Joi.array(),
    industryFailures: Joi.object(),
  }).optional(),
});

const evaluationSchema = Joi.object({
  userResponse: Joi.string().min(10).max(2000).required(),
  agentResponses: Joi.array().items(
    Joi.object({
      agent: Joi.string().required(),
      agentName: Joi.string().required(),
      response: Joi.string().required(),
    })
  ).required(),
  context: Joi.object({
    phase: Joi.number().min(0).max(7.5),
  }).optional(),
});

const evaluationQuestionSchema = Joi.object({
  phase: Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    prompt: Joi.string().required(),
    guidance: Joi.string().required(),
    dimensions: Joi.array().items(Joi.string()).default([]),
  }).required(),
  startupProfile: Joi.object({
    startupName: Joi.string().allow('').default(''),
    sector: Joi.string().allow('').default(''),
    geography: Joi.string().allow('').default(''),
    mission: Joi.string().allow('').default(''),
    beneficiaries: Joi.string().allow('').default(''),
    solutionApproach: Joi.string().allow('').default(''),
    model: Joi.string().allow('').default(''),
    stage: Joi.string().allow('').default(''),
  }).required(),
  previousResponses: Joi.array().items(
    Joi.object({
      phaseId: Joi.number(),
      phaseName: Joi.string(),
      answer: Joi.string().allow(''),
      score: Joi.number(),
      feedback: Joi.string().allow(''),
    })
  ).default([]),
});

// Get single agent response
router.post('/agent-response', authenticate, requireSubscription('pro', 'enterprise'), async (req, res) => {
  try {
    const { error, value } = agentResponseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const { agentType, userResponse, context } = value;
    const contextWithUserId = { ...context, userId: req.user._id };

    const agentResponse = await aiAgentService.generateAgentResponse(
      agentType,
      userResponse,
      contextWithUserId
    );

    logger.info(`Agent response generated: ${agentType} for user: ${req.user.email}`);

    res.json({
      success: true,
      data: agentResponse,
    });
  } catch (error) {
    logger.error('Error generating agent response:', error);
    res.status(500).json({
      error: 'Failed to generate agent response',
      message: error.message,
    });
  }
});

// Generate boardroom discussion with multiple agents
router.post('/boardroom', authenticate, requireSubscription('pro', 'enterprise'), async (req, res) => {
  try {
    const { error, value } = boardroomSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const { userResponse, context } = value;
    const contextWithUserId = { ...context, userId: req.user._id };

    const boardroomDiscussion = await aiAgentService.generateBoardroomDiscussion(
      userResponse,
      contextWithUserId
    );

    logger.info(`Boardroom discussion generated for user: ${req.user.email}`);

    res.json({
      success: true,
      data: boardroomDiscussion,
    });
  } catch (error) {
    logger.error('Error generating boardroom discussion:', error);
    res.status(500).json({
      error: 'Failed to generate boardroom discussion',
      message: error.message,
    });
  }
});

// Evaluate user response quality
router.post('/evaluate', authenticate, async (req, res) => {
  try {
    const { error, value } = evaluationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const { userResponse, agentResponses, context } = value;
    const contextWithUserId = { ...context, userId: req.user._id };

    const evaluation = await aiAgentService.evaluateResponse(
      userResponse,
      agentResponses,
      contextWithUserId
    );

    logger.info(`Response evaluation completed for user: ${req.user.email}`);

    res.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    logger.error('Error evaluating response:', error);
    res.status(500).json({
      error: 'Failed to evaluate response',
      message: error.message,
    });
  }
});

// Generate a market-readiness evaluation question with Gemini
router.post('/evaluation-question', async (req, res) => {
  try {
    const { error, value } = evaluationQuestionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }

    const question = await geminiService.generateEvaluationQuestion(value);

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    logger.error('Error generating evaluation question:', error);
    res.status(500).json({
      error: 'Failed to generate evaluation question',
      message: error.message,
    });
  }
});

// Get available agent types and their configurations
router.get('/agents', authenticate, (req, res) => {
  try {
    const agents = ['financeHead', 'techLead', 'communityLead', 'vcAuditor', 'devilAdvocate'];
    const agentConfigs = {};

    agents.forEach(agentType => {
      const config = aiAgentService.getAgentConfig(agentType);
      if (config) {
        agentConfigs[agentType] = {
          name: config.name,
          personality: config.personality,
          priorities: config.priorities,
          communicationStyle: config.communicationStyle,
        };
      }
    });

    res.json({
      success: true,
      data: {
        agents: agentConfigs,
        availableFeatures: {
          devilAdvocateMode: req.user.subscription.tier !== 'free',
          multiAgentBoardroom: req.user.subscription.tier !== 'free',
          responseEvaluation: true,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting agent configurations:', error);
    res.status(500).json({
      error: 'Failed to get agent configurations',
      message: error.message,
    });
  }
});

// Get agent configuration for specific type
router.get('/agents/:agentType', authenticate, (req, res) => {
  try {
    const { agentType } = req.params;
    const config = aiAgentService.getAgentConfig(agentType);

    if (!config) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `Agent type '${agentType}' is not available`,
      });
    }

    // Check if user has access to this agent
    if (agentType === 'devilAdvocate' && req.user.subscription.tier === 'free') {
      return res.status(403).json({
        error: 'Subscription required',
        message: 'Devil\'s Advocate mode requires a Pro subscription',
      });
    }

    res.json({
      success: true,
      data: {
        agentType,
        name: config.name,
        personality: config.personality,
        communicationStyle: config.communicationStyle,
        priorities: config.priorities,
        expertise: config.expertise,
        riskTolerance: config.riskTolerance,
      },
    });
  } catch (error) {
    logger.error('Error getting agent configuration:', error);
    res.status(500).json({
      error: 'Failed to get agent configuration',
      message: error.message,
    });
  }
});

// Test AI connectivity (for debugging)
router.get('/test', authenticate, async (req, res) => {
  try {
    const testResponse = await aiAgentService.generateAgentResponse(
      'financeHead',
      'Test response for connectivity check',
      { phase: 0, userId: req.user._id }
    );

    res.json({
      success: true,
      message: 'AI services are working correctly',
      data: {
        agentType: testResponse.agent,
        agentName: testResponse.agentName,
        responseLength: testResponse.response.length,
      },
    });
  } catch (error) {
    logger.error('AI connectivity test failed:', error);
    res.status(500).json({
      error: 'AI connectivity test failed',
      message: error.message,
    });
  }
});

module.exports = router;
