const Simulation = require('../models/Simulation');
const User = require('../models/User');
const aiAgentService = require('./aiAgents');
const marketService = require('./marketService');
const vvsService = require('./vvsService');
const biasDetectionService = require('./biasDetection');
const logger = require('../utils/logger');

class SimulationEngine {
  constructor() {
    this.phaseConfig = {
      0: {
        name: 'Market Confrontation',
        description: 'VC Auditor challenges market assumptions with live data',
        duration: 15, // minutes
        agents: ['vcAuditor'],
        requiredScore: 60,
        gatekeeper: true,
      },
      0.5: {
        name: 'Bias Calibration Intake',
        description: 'Founder mindset assessment and bias baseline scoring',
        duration: 10,
        agents: [],
        requiredScore: 50,
        gatekeeper: false,
      },
      1: {
        name: 'Problem Validation',
        description: 'Socratic interrogation of the core problem statement',
        duration: 20,
        agents: ['financeHead', 'techLead', 'communityLead'],
        requiredScore: 65,
        gatekeeper: false,
      },
      2: {
        name: 'Customer Discovery',
        description: 'Target persona stress test and market sizing challenge',
        duration: 25,
        agents: ['communityLead', 'financeHead'],
        requiredScore: 65,
        gatekeeper: false,
      },
      3: {
        name: 'Solution Architecture',
        description: 'Technical feasibility, build vs buy, MVP scoping',
        duration: 30,
        agents: ['techLead', 'financeHead'],
        requiredScore: 70,
        gatekeeper: false,
      },
      4: {
        name: 'Business Model Design',
        description: 'Revenue model, unit economics, pricing strategy',
        duration: 25,
        agents: ['financeHead', 'vcAuditor'],
        requiredScore: 70,
        gatekeeper: false,
      },
      5: {
        name: 'Go-to-Market Strategy',
        description: 'Distribution channels, launch strategy, trust-building',
        duration: 20,
        agents: ['communityLead', 'financeHead'],
        requiredScore: 65,
        gatekeeper: false,
      },
      6: {
        name: 'Risk & Resilience',
        description: 'Regulatory, competitive, and operational risk mapping',
        duration: 25,
        agents: ['financeHead', 'techLead', 'communityLead', 'vcAuditor'],
        requiredScore: 70,
        gatekeeper: false,
      },
      7: {
        name: 'Smart Report',
        description: 'Synthesis and artifact generation',
        duration: 15,
        agents: [],
        requiredScore: 0,
        gatekeeper: false,
      },
      7.5: {
        name: 'Investor Panel',
        description: 'Live AI investor Q&A simulation',
        duration: 20,
        agents: ['vcAuditor'],
        requiredScore: 75,
        gatekeeper: false,
      },
    };
  }

  // Create new simulation
  async createSimulation(userId, ventureData, settings = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check subscription limits
      if (user.subscription.tier === 'free') {
        const activeSimulations = await Simulation.find({ 
          user: userId, 
          status: { $in: ['created', 'in-progress'] }
        });
        
        if (activeSimulations.length >= 1) {
          throw new Error('Free tier users can only have 1 active simulation');
        }
      }

      const simulation = new Simulation({
        user: userId,
        venture: ventureData,
        currentPhase: 0,
        status: 'created',
        settings: {
          devilAdvocateMode: settings.devilAdvocateMode || false,
          language: settings.language || 'english',
          difficulty: settings.difficulty || 'intermediate',
          voiceMode: settings.voiceMode || false,
        },
        agents: this.initializeAgents(ventureData.industry, settings.difficulty),
      });

      await simulation.save();

      // Initialize phase 0
      await this.initializePhase(simulation._id, 0);

      logger.info(`New simulation created for user ${userId}: ${simulation._id}`);

      return simulation;
    } catch (error) {
      logger.error('Error creating simulation:', error);
      throw error;
    }
  }

  // Initialize agents for simulation
  initializeAgents(industry, difficulty = 'intermediate') {
    const baseAgents = {
      financeHead: {
        personality: 'Analytical and risk-focused',
        riskTolerance: difficulty === 'beginner' ? 'conservative' : 
                       difficulty === 'advanced' ? 'aggressive' : 'moderate',
        priorities: ['profitability', 'cash-flow', 'unit-economics', 'funding'],
      },
      techLead: {
        personality: 'Pragmatic and innovation-focused',
        technicalFocus: this.getTechnicalFocus(industry),
        buildVsBuyPreference: 'hybrid',
      },
      communityLead: {
        personality: 'Empathetic and user-centric',
        communityFocus: this.getCommunityFocus(industry),
        trustBuildingStyle: 'authentic',
      },
      vcAuditor: {
        stance: 'challenging but constructive',
        focusAreas: this.getVCFocusAreas(industry),
      },
    };

    if (difficulty === 'advanced') {
      baseAgents.devilAdvocate = {
        enabled: true,
        intensity: 'aggressive',
      };
    }

    return baseAgents;
  }

  // Get technical focus based on industry
  getTechnicalFocus(industry) {
    const focusMap = {
      'technology': ['scalability', 'architecture', 'performance'],
      'fintech': ['security', 'compliance', 'reliability'],
      'healthcare': ['hipaa-compliance', 'data-privacy', 'integration'],
      'edtech': ['user-experience', 'scalability', 'accessibility'],
      'ecommerce': ['performance', 'security', 'inventory-management'],
      'ai-ml': ['model-accuracy', 'scalability', 'data-pipeline'],
      'iot': ['connectivity', 'security', 'device-management'],
    };
    return focusMap[industry] || ['scalability', 'security', 'performance'];
  }

  // Get community focus based on industry
  getCommunityFocus(industry) {
    const focusMap = {
      'technology': ['developer-community', 'innovation', 'early-adopters'],
      'fintech': ['trust-building', 'financial-literacy', 'security-awareness'],
      'healthcare': ['patient-trust', 'medical-professionals', 'caregivers'],
      'edtech': ['educators', 'students', 'parents', 'institutions'],
      'ecommerce': ['customer-experience', 'brand-loyalty', 'social-proof'],
      'agriculture': ['farmers', 'supply-chain', 'rural-adoption'],
    };
    return focusMap[industry] || ['customer-adoption', 'trust-building', 'community-growth'];
  }

  // Get VC focus areas based on industry
  getVCFocusAreas(industry) {
    const focusMap = {
      'technology': ['market-size', 'competitive-advantage', 'team'],
      'fintech': ['regulatory-compliance', 'unit-economics', 'trust'],
      'healthcare': ['fda-approval', 'reimbursement', 'clinical-trials'],
      'edtech': ['institutional-adoption', 'learning-outcomes', 'scalability'],
      'ecommerce': ['customer-acquisition-cost', 'lifetime-value', 'supply-chain'],
    };
    return focusMap[industry] || ['market-size', 'competitive-advantage', 'scalability'];
  }

  // Initialize phase
  async initializePhase(simulationId, phase) {
    try {
      const simulation = await Simulation.findById(simulationId);
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      const phaseConfig = this.phaseConfig[phase];
      if (!phaseConfig) {
        throw new Error(`Invalid phase: ${phase}`);
      }

      // Add phase to history if not exists
      const existingPhase = simulation.phaseHistory.find(p => p.phase === phase);
      if (!existingPhase) {
        simulation.phaseHistory.push({
          phase,
          startedAt: new Date(),
        });
      }

      // Special initialization for phase 0 (Market Confrontation)
      if (phase === 0) {
        await this.initializeMarketConfrontation(simulation);
      }

      // Special initialization for phase 0.5 (Bias Calibration)
      if (phase === 0.5) {
        await this.initializeBiasCalibration(simulation);
      }

      await simulation.save();

      logger.info(`Phase ${phase} initialized for simulation ${simulationId}`);
      return simulation;
    } catch (error) {
      logger.error('Error initializing phase:', error);
      throw error;
    }
  }

  // Initialize Market Confrontation phase
  async initializeMarketConfrontation(simulation) {
    try {
      // Fetch live market data
      const marketData = await marketService.getMarketData(
        simulation.venture.industry,
        simulation.venture.targetMarket.geography
      );

      simulation.marketData = marketData;

      // Generate VC Auditor challenge
      const challenge = await this.generateVCChallenge(simulation, marketData);
      
      const phaseHistory = simulation.phaseHistory.find(p => p.phase === 0);
      if (phaseHistory) {
        phaseHistory.gatekeeperChallenge = {
          challenge: challenge.question,
          response: '',
          passed: false,
          score: 0,
        };
      }

      await simulation.save();
      return challenge;
    } catch (error) {
      logger.error('Error initializing market confrontation:', error);
      throw error;
    }
  }

  // Generate VC Auditor challenge
  async generateVCChallenge(simulation, marketData) {
    try {
      const prompt = `As a skeptical VC Auditor, generate a challenging question that confronts the founder with harsh market reality.

Venture Details:
- Industry: ${simulation.venture.industry}
- Business Model: ${simulation.venture.businessModel}
- Target Market: ${JSON.stringify(simulation.venture.targetMarket)}
- Description: ${simulation.venture.description}

Market Reality:
${JSON.stringify(marketData.trends?.slice(0, 3) || [])}
${JSON.stringify(marketData.competitors?.slice(0, 2) || [])}

Generate ONE specific, data-driven challenge question that:
1. References actual market data or competitor information
2. Questions a core assumption about the venture
3. Forces the founder to confront difficult market reality
4. Is uncomfortable but constructive
5. Cannot be answered with generic responses

Question:`;

      const response = await aiAgentService.generateAgentResponse(
        'vcAuditor',
        prompt,
        { 
          phase: 0, 
          ventureContext: simulation.venture,
          marketData,
          competitiveData: marketData.competitors,
        }
      );

      return {
        question: response.response,
        marketData: marketData,
        difficulty: 'high',
      };
    } catch (error) {
      logger.error('Error generating VC challenge:', error);
      throw error;
    }
  }

  // Initialize Bias Calibration phase
  async initializeBiasCalibration(simulation) {
    try {
      // This would integrate with bias detection service
      const biasAssessment = await biasDetectionService.assessFounderBias(simulation);
      
      const phaseHistory = simulation.phaseHistory.find(p => p.phase === 0.5);
      if (phaseHistory) {
        phaseHistory.biasAssessment = biasAssessment;
      }

      simulation.biasAnalysis = {
        detectedBiases: biasAssessment.detectedBiases,
        overallBiasScore: biasAssessment.overallScore,
      };

      await simulation.save();
      return biasAssessment;
    } catch (error) {
      logger.error('Error initializing bias calibration:', error);
      throw error;
    }
  }

  // Process user response in current phase
  async processResponse(simulationId, userResponse, additionalContext = {}) {
    try {
      const simulation = await Simulation.findById(simulationId);
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      const currentPhase = simulation.currentPhase;
      const phaseConfig = this.phaseConfig[currentPhase];

      if (!phaseConfig) {
        throw new Error(`Invalid current phase: ${currentPhase}`);
      }

      // Add response to phase history
      const phaseHistory = simulation.phaseHistory.find(p => p.phase === currentPhase);
      if (!phaseHistory) {
        throw new Error(`Phase ${currentPhase} not found in history`);
      }

      // Handle special phase logic
      if (currentPhase === 0) {
        return await this.processGatekeeperResponse(simulation, userResponse);
      }

      // Generate agent responses
      const agentResponses = await this.generateAgentResponses(
        simulation,
        userResponse,
        currentPhase,
        additionalContext
      );

      // Evaluate response quality
      const evaluation = await aiAgentService.evaluateResponse(
        userResponse,
        agentResponses.agents,
        { phase: currentPhase, userId: simulation.user }
      );

      // Update phase history with response and evaluation
      phaseHistory.responses.push({
        question: additionalContext.question || 'Response to agent feedback',
        answer: userResponse,
        agent: 'user',
        evaluation: {
          score: evaluation.overallScore,
          feedback: evaluation.improvements.join(', '),
          categories: Object.keys(evaluation.criteria).filter(key => 
            evaluation.criteria[key].score >= 7
          ),
        },
      });

      // Add agent responses to phase history
      agentResponses.agents.forEach(agentResponse => {
        phaseHistory.responses.push({
          question: additionalContext.question || 'Agent feedback',
          answer: agentResponse.response,
          agent: agentResponse.agent,
          evaluation: {
            score: 8, // Default score for agent responses
            feedback: 'AI agent perspective',
            categories: [agentResponse.agent],
          },
        });
      });

      // Extract and add insights
      const insights = this.extractInsights(agentResponses, evaluation);
      insights.forEach(insight => {
        phaseHistory.insights.push(insight);
      });

      // Update VVS score
      const vvsUpdate = await vvsService.calculateVVSScore(
        simulation,
        evaluation,
        agentResponses,
        currentPhase
      );

      simulation.updateVVSScore(vvsUpdate.overallScore, vvsUpdate.dimensionScores);

      // Check if phase can be completed
      const canAdvance = evaluation.overallScore >= phaseConfig.requiredScore;

      if (canAdvance) {
        await this.advancePhase(simulation);
      }

      await simulation.save();

      logger.info(`Response processed for simulation ${simulationId}, phase ${currentPhase}`);

      return {
        success: true,
        phase: currentPhase,
        canAdvance,
        evaluation,
        agentResponses,
        insights,
        vvsScore: simulation.vvsScore.overall,
        nextPhase: canAdvance ? this.getNextPhase(currentPhase) : currentPhase,
      };
    } catch (error) {
      logger.error('Error processing response:', error);
      throw error;
    }
  }

  // Process gatekeeper response (Phase 0)
  async processGatekeeperResponse(simulation, userResponse) {
    try {
      const phaseHistory = simulation.phaseHistory.find(p => p.phase === 0);
      const gatekeeperChallenge = phaseHistory.gatekeeperChallenge;

      // Evaluate response against market reality
      const evaluation = await this.evaluateGatekeeperResponse(
        simulation,
        userResponse,
        gatekeeperChallenge.challenge
      );

      gatekeeperChallenge.response = userResponse;
      gatekeeperChallenge.score = evaluation.score;
      gatekeeperChallenge.passed = evaluation.passed;

      phaseHistory.responses.push({
        question: gatekeeperChallenge.challenge,
        answer: userResponse,
        agent: 'vcAuditor',
        evaluation: {
          score: evaluation.score,
          feedback: evaluation.feedback,
          categories: evaluation.categories,
        },
      });

      // Add insights from gatekeeper challenge
      if (evaluation.insights) {
        evaluation.insights.forEach(insight => {
          phaseHistory.insights.push(insight);
        });
      }

      // Update VVS score with market dimension
      const marketScore = evaluation.score;
      simulation.vvsScore.dimensions.market = Math.max(
        simulation.vvsScore.dimensions.market,
        marketScore
      );

      const canAdvance = evaluation.passed;
      if (canAdvance) {
        await this.advancePhase(simulation);
      }

      await simulation.save();

      return {
        success: true,
        phase: 0,
        canAdvance,
        evaluation,
        gatekeeperChallenge: {
          challenge: gatekeeperChallenge.challenge,
          response: userResponse,
          passed: evaluation.passed,
          score: evaluation.score,
        },
        vvsScore: simulation.vvsScore.overall,
        nextPhase: canAdvance ? 0.5 : 0,
      };
    } catch (error) {
      logger.error('Error processing gatekeeper response:', error);
      throw error;
    }
  }

  // Evaluate gatekeeper response
  async evaluateGatekeeperResponse(simulation, userResponse, challenge) {
    try {
      const prompt = `Evaluate the founder's response to the VC Auditor challenge. Be rigorous but fair.

Challenge: "${challenge}"
Founder's Response: "${userResponse}"
Venture Context: ${JSON.stringify(simulation.venture)}
Market Data: ${JSON.stringify(simulation.marketData)}

Evaluate on:
1. Market awareness (0-100)
2. Acknowledgment of risks (0-100)
3. Specificity and data-driven thinking (0-100)
4. Realism vs. optimism (0-100)

Provide JSON:
{
  "score": 75,
  "passed": true,
  "feedback": "Shows good market awareness but needs more specific metrics",
  "categories": ["market-awareness", "risk-acknowledgment"],
  "insights": [
    {
      "type": "blindspot",
      "description": "Underestimates competitive pressure",
      "agent": "vcAuditor"
    }
  ]
}`;

      const response = await aiAgentService.generateAgentResponse(
        'vcAuditor',
        prompt,
        { phase: 0, ventureContext: simulation.venture }
      );

      try {
        return JSON.parse(response.response);
      } catch (parseError) {
        // Fallback evaluation
        return {
          score: 60,
          passed: false,
          feedback: 'Response needs to be more specific and data-driven',
          categories: ['needs-improvement'],
          insights: [],
        };
      }
    } catch (error) {
      logger.error('Error evaluating gatekeeper response:', error);
      throw error;
    }
  }

  // Generate agent responses for current phase
  async generateAgentResponses(simulation, userResponse, phase, additionalContext) {
    try {
      const phaseConfig = this.phaseConfig[phase];
      const agents = phaseConfig.agents;

      // Add devil's advocate if enabled
      if (simulation.settings.devilAdvocateMode && !agents.includes('devilAdvocate')) {
        agents.push('devilAdvocate');
      }

      const context = {
        phase,
        ventureContext: simulation.venture,
        previousContext: this.getPreviousContext(simulation),
        technicalRequirements: additionalContext.technicalRequirements,
        marketData: simulation.marketData,
        competitiveData: simulation.marketData?.competitors,
        failureCases: await this.getFailureCases(simulation.venture.industry),
        industryFailures: await this.getIndustryFailures(simulation.venture.industry),
        userId: simulation.user,
      };

      return await aiAgentService.generateBoardroomDiscussion(userResponse, context);
    } catch (error) {
      logger.error('Error generating agent responses:', error);
      throw error;
    }
  }

  // Get previous context for agents
  getPreviousContext(simulation) {
    const recentResponses = [];
    simulation.phaseHistory.forEach(phase => {
      phase.responses.slice(-3).forEach(response => {
        recentResponses.push({
          phase: phase.phase,
          agent: response.agent,
          response: response.answer,
        });
      });
    });
    return recentResponses.slice(-6); // Last 6 responses
  }

  // Get failure cases for industry
  async getFailureCases(industry) {
    // This would connect to a database of startup failures
    const failureCases = {
      'fintech': [
        { company: 'Paytm Payments Bank', issue: 'Regulatory compliance', year: 2021 },
        { company: 'BharatPe', issue: 'Corporate governance', year: 2022 },
      ],
      'edtech': [
        { company: 'Byju\'s', issue: 'Unit economics', year: 2023 },
        { company: 'Unacademy', issue: 'Cash burn', year: 2022 },
      ],
      'ecommerce': [
        { company: 'Pepperfry', issue: 'Profitability', year: 2022 },
        { company: 'ShopClues', issue: 'Market position', year: 2021 },
      ],
    };
    return failureCases[industry] || [];
  }

  // Get industry failure patterns
  async getIndustryFailures(industry) {
    // This would contain statistical failure patterns
    return {
      'fintech': {
        'regulatory-risk': 0.4,
        'unit-economics': 0.3,
        'competition': 0.2,
        'technology': 0.1,
      },
      'edtech': {
        'customer-acquisition': 0.35,
        'unit-economics': 0.25,
        'retention': 0.25,
        'competition': 0.15,
      },
    };
  }

  // Extract insights from agent responses
  extractInsights(agentResponses, evaluation) {
    const insights = [];
    
    // Add evaluation insights
    evaluation.strengths.forEach(strength => {
      insights.push({
        type: 'perspective-shift',
        description: `Strength identified: ${strength}`,
        agent: 'evaluation',
      });
    });

    evaluation.improvements.forEach(improvement => {
      insights.push({
        type: 'blindspot',
        description: `Area for improvement: ${improvement}`,
        agent: 'evaluation',
      });
    });

    // Add synthesis insights
    if (agentResponses.synthesis) {
      agentResponses.synthesis.keyThemes.forEach(theme => {
        insights.push({
          type: 'opportunity',
          description: `Key theme: ${theme.theme}`,
          agent: 'synthesis',
        });
      });
    }

    return insights;
  }

  // Advance to next phase
  async advancePhase(simulation) {
    try {
      const nextPhase = this.getNextPhase(simulation.currentPhase);
      
      if (nextPhase === null) {
        // Simulation completed
        await this.completeSimulation(simulation);
        return;
      }

      simulation.currentPhase = nextPhase;
      simulation.status = 'in-progress';

      // Initialize next phase
      await this.initializePhase(simulation._id, nextPhase);

      logger.info(`Simulation ${simulation._id} advanced to phase ${nextPhase}`);
    } catch (error) {
      logger.error('Error advancing phase:', error);
      throw error;
    }
  }

  // Get next phase
  getNextPhase(currentPhase) {
    const phases = [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 7.5];
    const currentIndex = phases.indexOf(currentPhase);
    
    if (currentIndex < phases.length - 1) {
      return phases[currentIndex + 1];
    }
    
    return null; // Simulation completed
  }

  // Complete simulation
  async completeSimulation(simulation) {
    try {
      simulation.status = 'completed';
      simulation.completionData = {
        completedAt: new Date(),
        totalDuration: simulation.phaseHistory.reduce((total, phase) => 
          total + (phase.duration || 0), 0
        ),
        phasesCompleted: simulation.phaseHistory.length,
        finalVVS: simulation.vvsScore.overall,
        certificateIssued: simulation.vvsScore.overall >= 65,
      };

      // Update user stats
      const user = await User.findById(simulation.user);
      if (user) {
        user.stats.simulationsCompleted += 1;
        user.stats.totalSimulationTime += simulation.completionData.totalDuration;
        user.stats.highestVVS = Math.max(user.stats.highestVVS, simulation.vvsScore.overall);
        user.stats.averageVVS = (
          (user.stats.averageVVS * (user.stats.simulationsCompleted - 1) + simulation.vvsScore.overall) /
          user.stats.simulationsCompleted
        );

        // Add badges
        if (simulation.vvsScore.overall >= 80) {
          user.badges.push({
            type: 'vvs-80',
            earnedAt: new Date(),
          });
        }

        if (simulation.settings.devilAdvocateMode) {
          user.badges.push({
            type: 'devil-advocate-survivor',
            earnedAt: new Date(),
          });
        }

        await user.save();
      }

      await simulation.save();

      logger.info(`Simulation ${simulation._id} completed with VVS: ${simulation.vvsScore.overall}`);
    } catch (error) {
      logger.error('Error completing simulation:', error);
      throw error;
    }
  }

  // Get simulation state
  async getSimulationState(simulationId) {
    try {
      const simulation = await Simulation.findById(simulationId)
        .populate('user', 'firstName lastName email');

      if (!simulation) {
        throw new Error('Simulation not found');
      }

      const currentPhaseConfig = this.phaseConfig[simulation.currentPhase];
      
      return {
        simulation,
        currentPhaseConfig,
        progress: simulation.progress,
        isCompleted: simulation.isCompleted,
        canAdvance: await this.canAdvancePhase(simulation),
      };
    } catch (error) {
      logger.error('Error getting simulation state:', error);
      throw error;
    }
  }

  // Check if phase can be advanced
  async canAdvancePhase(simulation) {
    try {
      const currentPhase = simulation.currentPhase;
      const phaseHistory = simulation.phaseHistory.find(p => p.phase === currentPhase);
      
      if (!phaseHistory) {
        return false;
      }

      const phaseConfig = this.phaseConfig[currentPhase];
      if (!phaseConfig) {
        return false;
      }

      // For gatekeeper phases, check if passed
      if (phaseConfig.gatekeeper && phaseHistory.gatekeeperChallenge) {
        return phaseHistory.gatekeeperChallenge.passed;
      }

      // For regular phases, check latest response score
      const latestResponse = phaseHistory.responses[phaseHistory.responses.length - 1];
      if (latestResponse && latestResponse.evaluation) {
        return latestResponse.evaluation.score >= phaseConfig.requiredScore;
      }

      return false;
    } catch (error) {
      logger.error('Error checking if phase can advance:', error);
      return false;
    }
  }

  // Pause simulation
  async pauseSimulation(simulationId) {
    try {
      const simulation = await Simulation.findById(simulationId);
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      simulation.status = 'paused';
      await simulation.save();

      logger.info(`Simulation ${simulationId} paused`);
      return simulation;
    } catch (error) {
      logger.error('Error pausing simulation:', error);
      throw error;
    }
  }

  // Resume simulation
  async resumeSimulation(simulationId) {
    try {
      const simulation = await Simulation.findById(simulationId);
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      simulation.status = 'in-progress';
      await simulation.save();

      logger.info(`Simulation ${simulationId} resumed`);
      return simulation;
    } catch (error) {
      logger.error('Error resuming simulation:', error);
      throw error;
    }
  }

  // Abandon simulation
  async abandonSimulation(simulationId) {
    try {
      const simulation = await Simulation.findById(simulationId);
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      simulation.status = 'abandoned';
      await simulation.save();

      logger.info(`Simulation ${simulationId} abandoned`);
      return simulation;
    } catch (error) {
      logger.error('Error abandoning simulation:', error);
      throw error;
    }
  }
}

module.exports = new SimulationEngine();
