const simulationEngine = require('./simulationEngine');

const PHASE_SEQUENCE = [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 7.5];

const AGENT_LABELS = {
  financeHead: 'Investor and sustainability lead',
  techLead: 'Implementation and delivery lead',
  communityLead: 'Customer and community lead',
  vcAuditor: 'Investor and due-diligence panel',
  devilAdvocate: 'Risk and crisis challenger',
};

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score || 0)));

const getCurrentPhaseHistory = (simulation) =>
  simulation.phaseHistory.find((phase) => phase.phase === simulation.currentPhase);

const getLatestUserDecision = (simulation) => {
  const history = getCurrentPhaseHistory(simulation);
  if (!history) {
    return null;
  }

  const userResponses = history.responses.filter((response) => response.agent === 'user');
  return userResponses[userResponses.length - 1] || null;
};

const buildEventNotifications = (simulation) => {
  const alerts = [];
  const { regulatoryCompliance, biasAnalysis, vvsScore } = simulation;

  if (regulatoryCompliance?.policyAlerts?.length) {
    regulatoryCompliance.policyAlerts.slice(0, 2).forEach((alert) => {
      alerts.push({
        type: 'policy',
        title: alert.title || 'Policy watch',
        description: alert.impact || alert.description || 'A policy change may affect launch timing.',
      });
    });
  }

  if ((biasAnalysis?.detectedBiases || []).length) {
    biasAnalysis.detectedBiases.slice(0, 2).forEach((bias) => {
      alerts.push({
        type: 'bias',
        title: `Bias risk: ${bias.type}`,
        description: bias.intervention || bias.description || 'This bias may distort decision quality.',
      });
    });
  }

  if ((vvsScore?.dimensions?.regulatory || 0) < 50) {
    alerts.push({
      type: 'compliance',
      title: 'Regulatory readiness is weak',
      description: 'Government approvals or policy alignment could slow public rollout.',
    });
  }

  if ((vvsScore?.dimensions?.financial || 0) < 50) {
    alerts.push({
      type: 'financial',
      title: 'Financial resilience is under pressure',
      description: 'Investor scrutiny and delivery tradeoffs are likely to intensify.',
    });
  }

  return alerts;
};

const buildScoreCard = (simulation) => {
  const dimensions = simulation.vvsScore?.dimensions || {};

  return {
    readiness: clampScore(simulation.vvsScore?.overall),
    impact: clampScore(dimensions.market),
    sustainability: clampScore(dimensions.financial),
    risk: clampScore(
      100 - (((dimensions.regulatory || 0) + (dimensions.execution || 0)) / 2),
    ),
    ethics: clampScore(
      ((dimensions.team || 0) + (100 - (simulation.biasAnalysis?.overallBiasScore || 0))) / 2,
    ),
    technical: clampScore(dimensions.technical),
    regulatory: clampScore(dimensions.regulatory),
    execution: clampScore(dimensions.execution),
  };
};

const buildScenarioNarrative = (simulation) => {
  const history = getCurrentPhaseHistory(simulation);
  const phaseConfig = simulationEngine.phaseConfig[simulation.currentPhase];

  if (!phaseConfig) {
    return 'A new social entrepreneurship simulation phase is ready.';
  }

  if (history?.gatekeeperChallenge?.challenge) {
    return history.gatekeeperChallenge.challenge;
  }

  const latestAgentMessage = [...(history?.responses || [])]
    .reverse()
    .find((response) => response.agent && response.agent !== 'user');

  if (latestAgentMessage?.answer) {
    return latestAgentMessage.answer;
  }

  return `${phaseConfig.description}. Respond as if you are making a real market-facing decision for a social venture.`;
};

const buildStakeholders = (simulation) => {
  const phaseConfig = simulationEngine.phaseConfig[simulation.currentPhase];

  return (phaseConfig?.agents || []).map((agent) => ({
    id: agent,
    label: AGENT_LABELS[agent] || agent,
  }));
};

const buildRecommendedOptions = (simulation) => {
  const scoreCard = buildScoreCard(simulation);

  return [
    {
      id: 'pilot',
      label: 'Pilot with a small partner cohort first',
      expectedEffect: 'Reduces rollout risk and improves learning speed before a wider launch.',
      scoreBias: scoreCard.risk >= 55 ? '+4 resilience' : '+7 resilience',
    },
    {
      id: 'partner',
      label: 'Secure institutional backing before public expansion',
      expectedEffect: 'Improves legitimacy with funders, local authorities, and ecosystem partners.',
      scoreBias: '+5 sustainability',
    },
    {
      id: 'public-launch',
      label: 'Push for a broader market launch now',
      expectedEffect: 'Can accelerate adoption, but may expose operational and policy gaps faster.',
      scoreBias: scoreCard.readiness >= 70 ? '+4 impact' : '-6 risk',
    },
  ];
};

const buildScenarioPayload = async (simulation) => {
  const phaseConfig = simulationEngine.phaseConfig[simulation.currentPhase];
  const history = getCurrentPhaseHistory(simulation);
  const latestUserDecision = getLatestUserDecision(simulation);

  return {
    sessionId: simulation._id,
    status: simulation.status,
    currentScenario: {
      phase: simulation.currentPhase,
      phaseName: phaseConfig?.name || 'Unknown phase',
      description: phaseConfig?.description || '',
      prompt: buildScenarioNarrative(simulation),
      stakeholders: buildStakeholders(simulation),
      recommendedOptions: buildRecommendedOptions(simulation),
      lastDecision: latestUserDecision
        ? {
            answer: latestUserDecision.answer,
            score: latestUserDecision.evaluation?.score || 0,
            feedback: latestUserDecision.evaluation?.feedback || '',
          }
        : null,
    },
    metrics: buildScoreCard(simulation),
    notifications: buildEventNotifications(simulation),
    progress: {
      completedPhases: simulation.phaseHistory.filter((phase) => phase.completedAt).length,
      totalPhases: PHASE_SEQUENCE.length,
      percentComplete: Math.round((PHASE_SEQUENCE.indexOf(simulation.currentPhase) / (PHASE_SEQUENCE.length - 1)) * 100),
    },
    history: (history?.responses || []).slice(-5).map((response) => ({
      agent: response.agent,
      question: response.question,
      answer: response.answer,
      score: response.evaluation?.score || null,
      feedback: response.evaluation?.feedback || '',
      timestamp: response.timestamp,
    })),
  };
};

const buildReportPayload = async (simulation) => {
  const scoreCard = buildScoreCard(simulation);
  const insights = simulation.phaseHistory.flatMap((phase) =>
    phase.insights.map((insight) => ({
      phase: phase.phase,
      type: insight.type,
      description: insight.description,
      agent: insight.agent,
    })),
  );

  const strengths = insights
    .filter((insight) => ['opportunity', 'perspective-shift'].includes(insight.type))
    .slice(0, 4);
  const risks = insights
    .filter((insight) => ['blindspot', 'risk-identified'].includes(insight.type))
    .slice(0, 4);

  return {
    sessionId: simulation._id,
    startup: {
      name: simulation.venture.name,
      industry: simulation.venture.industry,
      geography: simulation.venture.targetMarket?.geography || '',
      businessModel: simulation.venture.businessModel,
    },
    summary: {
      readinessDecision:
        scoreCard.readiness >= 75
          ? 'Ready for a controlled market launch'
          : scoreCard.readiness >= 60
            ? 'Promising, but needs targeted de-risking before launch'
            : 'Not ready for market entry yet',
      completedAt: simulation.completionData?.completedAt || null,
      currentPhase: simulation.currentPhase,
      currentPhaseName: simulation.currentPhaseName,
    },
    scores: scoreCard,
    strengths,
    risks,
    timeline: simulation.vvsScore?.trajectory || [],
    recommendations: [
      'Use investor, customer, and policy feedback to refine the next launch milestone.',
      'Prioritize the weakest score dimension before scaling to a larger geography.',
      'Document stakeholder objections and operational safeguards as part of go-to-market planning.',
    ],
    artifacts: simulation.artifacts || {},
    notifications: buildEventNotifications(simulation),
  };
};

const normalizeIndustry = (industry) => {
  const normalized = String(industry || 'other').trim().toLowerCase();
  const supported = new Set([
    'technology',
    'healthcare',
    'fintech',
    'edtech',
    'ecommerce',
    'manufacturing',
    'agriculture',
    'renewable-energy',
    'biotech',
    'ai-ml',
    'blockchain',
    'iot',
    'other',
  ]);

  return supported.has(normalized) ? normalized : 'other';
};

const inferBusinessModel = (modelText) => {
  const normalized = String(modelText || '').toLowerCase();

  if (normalized.includes('subscription')) {
    return 'subscription';
  }
  if (normalized.includes('marketplace')) {
    return 'marketplace';
  }
  if (normalized.includes('freemium')) {
    return 'freemium';
  }
  if (normalized.includes('b2b2c')) {
    return 'b2b2c';
  }
  if (normalized.includes('b2b')) {
    return 'b2b';
  }
  if (normalized.includes('c2c')) {
    return 'c2c';
  }

  return 'b2c';
};

const inferGeography = (geographyText) => {
  const normalized = String(geographyText || '').toLowerCase();

  if (normalized.includes('international') || normalized.includes('global')) {
    return 'international';
  }
  if (normalized.includes('regional') || normalized.includes('state')) {
    return 'regional';
  }
  if (normalized.includes('local') || normalized.includes('district') || normalized.includes('city')) {
    return 'local';
  }

  return 'national';
};

const inferDifficulty = (stage) => {
  const normalized = String(stage || '').toLowerCase();

  if (normalized.includes('idea') || normalized.includes('concept')) {
    return 'beginner';
  }
  if (normalized.includes('growth') || normalized.includes('scal')) {
    return 'advanced';
  }

  return 'intermediate';
};

const buildSimulationInput = (payload) => {
  if (payload.venture) {
    return {
      venture: {
        ...payload.venture,
        industry: normalizeIndustry(payload.venture.industry),
      },
      settings: payload.settings || {},
    };
  }

  const descriptionParts = [
    payload.problem || payload.mission,
    payload.solutionApproach,
    payload.operatingModel,
  ].filter(Boolean);

  return {
    venture: {
      name: payload.startupName,
      description: descriptionParts.join(' ').slice(0, 1000),
      industry: normalizeIndustry(payload.sector),
      targetMarket: {
        geography: inferGeography(payload.geography),
        segment: payload.beneficiaries || 'Mission-driven customers and partners',
        size: payload.marketSize || '',
      },
      businessModel: inferBusinessModel(payload.operatingModel || payload.model),
    },
    settings: {
      devilAdvocateMode: payload.devilAdvocateMode || false,
      language: payload.language || 'english',
      difficulty: inferDifficulty(payload.stage),
      voiceMode: false,
    },
  };
};

module.exports = {
  buildSimulationInput,
  buildScenarioPayload,
  buildReportPayload,
};
