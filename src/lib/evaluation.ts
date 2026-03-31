export type ReadinessDimension =
  | "needClarity"
  | "communityTrust"
  | "innovationFit"
  | "sustainability"
  | "goToMarket"
  | "governance";

export type EvaluationPhase = {
  id: number;
  name: string;
  shortLabel: string;
  prompt: string;
  guidance: string;
  placeholder: string;
  agentName: string;
  agentRole: string;
  keywords: string[];
  dimensions: ReadinessDimension[];
};

export type StartupProfile = {
  startupName: string;
  sector: string;
  geography: string;
  mission: string;
  beneficiaries: string;
  solutionApproach: string;
  model: string;
  stage: string;
  difficulty: "easy" | "realistic" | "hardcore";
  evaluationMode: "reality-engine" | "pitch-evaluator";
};

export type PhaseResponse = {
  phaseId: number;
  phaseName: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  blindspots: string[];
  stakeholderReaction: string;
  mentorTip: string;
  shortTermOutcome: string;
  longTermOutcome: string;
  disruption: string | null;
  timestamp: string;
};

export type RealityDisruption = {
  title: string;
  description: string;
  impact: string;
};

export type SmartScorecard = {
  impact: number;
  financialSustainability: number;
  ethics: number;
  risk: number;
};

export type FailureReplayItem = {
  phaseId: number;
  phaseName: string;
  issue: string;
  betterAlternative: string;
};

export type EvaluationSession = {
  id: string;
  profile: StartupProfile;
  status: "in-progress" | "completed";
  currentPhaseIndex: number;
  responses: PhaseResponse[];
  dimensionScores: Record<ReadinessDimension, number>;
  overallScore: number;
  readinessDecision: string;
  readinessSummary: string;
  strengths: string[];
  blindspots: string[];
  recommendedActions: string[];
  scorecard: SmartScorecard;
  mentorTip: string;
  activeDisruption: RealityDisruption | null;
  disruptionHistory: RealityDisruption[];
  level: string;
  badges: string[];
  failureReplay: FailureReplayItem[];
  createdAt: string;
  updatedAt: string;
};

export const evaluationPhases: EvaluationPhase[] = [
  {
    id: 1,
    name: "Investor Challenge",
    shortLabel: "Investor",
    prompt: "If an impact investor challenged you by saying, 'This social problem is not urgent enough to justify a social innovation,' what evidence would you use to prove that the problem is real, painful, and important enough to solve now?",
    guidance: "Answer like you are defending a social entrepreneurship case. Be specific about the affected community, lived pain, urgency, and proof that this is more than a good intention.",
    placeholder: "Answer as if an impact investor is challenging whether this social problem deserves a scalable innovation response...",
    agentName: "Impact Investor",
    agentRole: "Urgency and investability review",
    keywords: ["problem", "evidence", "community", "beneficiary", "data", "urgent", "research", "investor", "demand", "pain"],
    dimensions: ["needClarity", "communityTrust"],
  },
  {
    id: 2,
    name: "Customer Reaction",
    shortLabel: "Customer",
    prompt: "If the end beneficiary, community member, or frontline institution saw this social innovation today, what would make them trust it, try it, and keep using it, and what would make them reject it immediately?",
    guidance: "Answer from the beneficiary and community point of view. Reference interviews, pilots, objections, trust barriers, affordability, accessibility, and adoption signals.",
    placeholder: "Describe how real beneficiaries, communities, or frontline institutions would react, what builds trust, and what causes rejection...",
    agentName: "End Customer Panel",
    agentRole: "Customer trust and adoption review",
    keywords: ["pilot", "interview", "trust", "school", "hospital", "ngo", "partner", "feedback", "adoption", "customer", "beneficiary", "reject"],
    dimensions: ["communityTrust", "goToMarket"],
  },
  {
    id: 3,
    name: "Field Reality Test",
    shortLabel: "Field",
    prompt: "If a field operator told you, 'Your idea sounds good, but we do not have the budget, staff, devices, or infrastructure to run this,' how would you prove the solution is still practical?",
    guidance: "Focus on real operating constraints, difficult tradeoffs, delivery feasibility, resource allocation, and what the minimum workable version looks like in the field.",
    placeholder: "Explain how the solution still works when money, devices, staffing, and infrastructure are limited...",
    agentName: "Field Operator",
    agentRole: "Operational feasibility review",
    keywords: ["offline", "training", "feasible", "prototype", "device", "workflow", "measure", "outcomes", "budget", "staff", "allocate", "resources", "field"],
    dimensions: ["innovationFit", "goToMarket"],
  },
  {
    id: 4,
    name: "Payer and Funder Review",
    shortLabel: "Payer",
    prompt: "If a payer, grantmaker, CSR program, or public procurement team asked, 'Who exactly funds or pays for this social innovation, why would they keep supporting it, and how do we know the mission will not drift once revenue pressure starts?' what would you say?",
    guidance: "Clarify payer logic, grants, procurement, cross-subsidy, repeat support, and how mission protection is built into the model.",
    placeholder: "Explain who funds or pays for the social innovation, why support continues, and how the mission stays protected...",
    agentName: "Funder Committee",
    agentRole: "Revenue and mission-protection review",
    keywords: ["revenue", "pricing", "grant", "csr", "subscription", "margin", "sustainable", "funding", "procurement", "payer"],
    dimensions: ["sustainability", "needClarity"],
  },
  {
    id: 5,
    name: "Stakeholder Navigation",
    shortLabel: "Stakeholder",
    prompt: "If your first public rollout depends on institutions, NGOs, schools, hospitals, self-help groups, or local government bodies, who can unblock adoption, who can stall it, and how will you win each of them?",
    guidance: "Describe first partner institutions, anchor communities, stakeholder mapping, approvals, procurement gates, rollout sequencing, and how you handle conflicting interests.",
    placeholder: "Map the social ecosystem stakeholders who can approve, delay, block, or champion your rollout and explain your plan for each...",
    agentName: "Stakeholder Board",
    agentRole: "Launch and stakeholder review",
    keywords: ["launch", "pilot", "partner", "customer", "market", "channel", "rollout", "sales", "government", "approval", "stakeholder", "ngo", "procurement"],
    dimensions: ["goToMarket", "communityTrust"],
  },
  {
    id: 6,
    name: "Policy and Risk Interference",
    shortLabel: "Policy",
    prompt: "What government policies, compliance rules, safeguarding requirements, or reputational risks could interfere with making this public, and what safeguards do you have if one of them hits early?",
    guidance: "Answer like a regulator or policy reviewer is scrutinizing the launch. Call out approvals, legal exposure, compliance duties, operational risks, and fallback plans.",
    placeholder: "Explain the policies, compliance issues, reputational risks, and operational safeguards that could affect launch...",
    agentName: "Policy Reviewer",
    agentRole: "Policy, compliance, and resilience review",
    keywords: ["risk", "policy", "compliance", "safeguarding", "fallback", "operations", "contingency", "staffing", "government", "regulation", "approval"],
    dimensions: ["governance", "sustainability"],
  },
  {
    id: 7,
    name: "Proof for Scale",
    shortLabel: "Proof",
    prompt: "If an impact investor, beneficiary institution, and public-sector partner all asked for proof at the same time, what metrics and evaluation signals would convince them that the social innovation creates measurable value and is ready to scale responsibly?",
    guidance: "Include adoption, retention, trust, social outcomes, efficiency, evidence quality, and the signals that different social-innovation stakeholders would each care about.",
    placeholder: "Describe the proof points that would convince impact investors, beneficiary institutions, and public partners that this works...",
    agentName: "Evidence Panel",
    agentRole: "Proof and readiness review",
    keywords: ["metrics", "impact", "outcomes", "retention", "evidence", "baseline", "measurement", "data", "investor", "customer", "partner"],
    dimensions: ["needClarity", "innovationFit", "governance"],
  },
  {
    id: 8,
    name: "Market Readiness Panel",
    shortLabel: "Decision",
    prompt: "Why is this social venture ready for public adoption now, and what would convince an impact investor, an end beneficiary or institution, and a strategic or government partner that you can execute responsibly?",
    guidance: "Make the case across three social entrepreneurship lenses at once: impact confidence, beneficiary reaction, and institutional or policy readiness.",
    placeholder: "Make the final case for why the social venture is ready now and why key stakeholders should trust the rollout...",
    agentName: "Readiness Panel",
    agentRole: "Investor, customer, and policy decision review",
    keywords: ["ready", "traction", "partner", "market", "execute", "scale", "evidence", "timing", "investor", "customer", "government"],
    dimensions: ["goToMarket", "sustainability", "governance"],
  },
];

export const defaultDimensionScores: Record<ReadinessDimension, number> = {
  needClarity: 52,
  communityTrust: 52,
  innovationFit: 52,
  sustainability: 52,
  goToMarket: 52,
  governance: 52,
};

const disruptionLibrary: Record<string, RealityDisruption[]> = {
  default: [
    {
      title: "Policy change lands early",
      description: "A local authority introduces a new approval requirement before public rollout.",
      impact: "Compliance work rises and launch speed may drop.",
    },
    {
      title: "Funding cut hits the pilot",
      description: "A grant or sponsor delays the next tranche of support.",
      impact: "You need a leaner rollout plan and sharper resource allocation.",
    },
    {
      title: "Social backlash emerges online",
      description: "A vocal community group questions your intent and operating model.",
      impact: "Trust drops unless communication and local partnerships improve fast.",
    },
    {
      title: "Media coverage drives viral growth",
      description: "A news mention causes a sudden spike in inbound demand.",
      impact: "Operational strain rises, but so does market proof if you handle it well.",
    },
  ],
  healthcare: [
    {
      title: "District health officer raises safeguards",
      description: "Officials want stronger consent, referral, and data-handling processes.",
      impact: "Policy readiness becomes a gating factor before scale.",
    },
  ],
  education: [
    {
      title: "School leadership questions classroom disruption",
      description: "Teachers worry the intervention will add workload and reduce teaching time.",
      impact: "Adoption now depends on ease of implementation and training support.",
    },
  ],
  environment: [
    {
      title: "Community questions land and livelihood effects",
      description: "Residents want proof the innovation will not create hidden local harm.",
      impact: "Trust and stakeholder engagement become the immediate priority.",
    },
  ],
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const unique = (items: string[]) => [...new Set(items)];

export const createSessionId = () =>
  `eval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createEmptySession = (profile: StartupProfile): EvaluationSession => ({
  id: createSessionId(),
  profile,
  status: "in-progress",
  currentPhaseIndex: 0,
  responses: [],
  dimensionScores: { ...defaultDimensionScores },
  overallScore: 52,
  readinessDecision: "Needs more evidence before public rollout",
  readinessSummary: "This social venture has not completed enough evidence-based evaluation yet.",
  strengths: [],
  blindspots: [],
  recommendedActions: [],
  scorecard: {
    impact: 52,
    financialSustainability: 52,
    ethics: 52,
    risk: 48,
  },
  mentorTip: "Use the AI-powered reality engine to balance impact, resilience, and stakeholder trust in every decision.",
  activeDisruption: null,
  disruptionHistory: [],
  level: "Beginner",
  badges: [],
  failureReplay: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const rebuildSessionFromResponses = (
  profile: StartupProfile,
  responses: Array<Pick<PhaseResponse, "answer">>,
): EvaluationSession => {
  let session = createEmptySession(profile);
  const createdAt = session.createdAt;

  responses.forEach((response) => {
    session = applyPhaseResponse(session, response.answer);
  });

  return {
    ...session,
    createdAt,
    updatedAt: new Date().toISOString(),
  };
};

const scoreAnswer = (answer: string, phase: EvaluationPhase) => {
  const normalized = answer.toLowerCase();
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const keywordMatches = phase.keywords.filter((keyword) => normalized.includes(keyword)).length;
  const keywordCoverage = keywordMatches / phase.keywords.length;
  const lengthScore = clamp(wordCount / 140, 0, 1);
  const evidenceBoost = /(data|pilot|evidence|partner|customer|school|ngo|metric|revenue|grant|launch|compliance)/.test(normalized) ? 1 : 0;
  const riskBoost = /(risk|challenge|fallback|constraint|limitation|contingency)/.test(normalized) ? 1 : 0;
  const score = clamp(
    Math.round(42 + lengthScore * 20 + keywordCoverage * 20 + evidenceBoost * 10 + riskBoost * 8),
    40,
    95,
  );
  return { score, wordCount, keywordMatches };
};

const buildFeedback = (phase: EvaluationPhase, answer: string, score: number) => {
  const normalized = answer.toLowerCase();
  const strengths: string[] = [];
  const blindspots: string[] = [];

  if (/(data|pilot|evidence|survey|interview|metric|baseline)/.test(normalized)) {
    strengths.push(`Backed the ${phase.name.toLowerCase()} case with evidence instead of assumptions.`);
  }
  if (/(partner|school|ngo|hospital|customer|community|government)/.test(normalized)) {
    strengths.push("Identified concrete stakeholders who can unlock adoption or delivery.");
  }
  if (/(revenue|grant|pricing|csr|budget|cost|margin)/.test(normalized)) {
    strengths.push("Addressed financial sustainability instead of relying on mission alone.");
  }
  if (/(risk|compliance|fallback|contingency|safeguarding)/.test(normalized)) {
    strengths.push("Showed awareness of market-entry risks and operating constraints.");
  }

  if (!/(data|pilot|evidence|survey|interview|metric|baseline)/.test(normalized)) {
    blindspots.push(`Add stronger evidence for ${phase.name.toLowerCase()} instead of relying on narrative alone.`);
  }
  if (!/(partner|customer|school|ngo|hospital|community|buyer|channel)/.test(normalized)) {
    blindspots.push("Clarify who unlocks adoption first and how they will be convinced.");
  }
  if (phase.id >= 4 && !/(revenue|grant|pricing|csr|cost|budget|margin|procurement)/.test(normalized)) {
    blindspots.push("The sustainability path is still vague and needs concrete operating economics.");
  }
  if (phase.id >= 5 && !/(launch|rollout|pilot|timeline|channel|market|sales)/.test(normalized)) {
    blindspots.push("The go-to-market path is not yet specific enough for a real launch decision.");
  }

  if (strengths.length === 0) {
    strengths.push(`Established a clear starting point for the ${phase.name.toLowerCase()} review.`);
  }

  const feedback =
    score >= 80
      ? `${phase.agentName} sees strong evidence that this startup is progressing toward market readiness in ${phase.name.toLowerCase()}.`
      : score >= 65
        ? `${phase.agentName} sees promise here, but this area still needs sharper proof before market entry.`
        : `${phase.agentName} sees meaningful gaps that would weaken market readiness if left unresolved.`;

  return {
    feedback,
    strengths: unique(strengths).slice(0, 2),
    blindspots: unique(blindspots).slice(0, 2),
  };
};

const getResponseLine = (answer: string, label: string) => {
  const pattern = new RegExp(`${label}:\\s*(.+)`);
  const match = answer.match(pattern);
  return match?.[1]?.trim() ?? "";
};

const buildStakeholderReaction = (phase: EvaluationPhase, score: number) => {
  if (score >= 80) {
    return `${phase.agentName} sees a credible path and would stay engaged if you maintain execution discipline.`;
  }
  if (score >= 65) {
    return `${phase.agentName} sees potential, but would ask for stronger proof before backing a wider rollout.`;
  }
  return `${phase.agentName} would likely hesitate, delay, or challenge the launch until major gaps are closed.`;
};

const buildMentorTip = (phase: EvaluationPhase, score: number, answer: string) => {
  const normalized = answer.toLowerCase();

  if (score < 65) {
    return `Mentor note: before moving on, tighten your ${phase.name.toLowerCase()} answer with one concrete proof point, one stakeholder owner, and one fallback plan.`;
  }
  if (!/(policy|government|compliance|approval)/.test(normalized) && phase.id >= 5) {
    return "Mentor note: add policy and institutional friction early so the plan feels ready for the real operating environment.";
  }
  if (!/(customer|community|beneficiar|school|clinic|ngo)/.test(normalized)) {
    return "Mentor note: strengthen the customer and community reaction angle so the market view is not only founder-driven.";
  }

  return "Mentor note: this is moving in the right direction. Keep pressure-testing the tradeoff between speed, trust, and sustainability.";
};

const buildConsequenceTimeline = (phase: EvaluationPhase, score: number, answer: string) => {
  const chosenOption = getResponseLine(answer, "Chosen option");
  const selectedConsequence = getResponseLine(answer, "Expected consequence");
  const baseChoice = chosenOption || "your current response path";
  const shortTermOutcome = selectedConsequence
    || `Immediately after choosing ${baseChoice}, stakeholders reassess whether the venture looks practical and credible.`;

  const longTermOutcome =
    score >= 80
      ? `Three months later, ${baseChoice} strengthens trust and creates a stronger case for controlled scale.`
      : score >= 65
        ? `Three months later, ${baseChoice} creates mixed signals. Momentum remains possible, but weak spots can still slow adoption.`
        : `Three months later, ${baseChoice} increases the chance of trust erosion, partner hesitation, or a stalled launch.`;

  return { shortTermOutcome, longTermOutcome };
};

const buildSmartScorecard = (dimensionScores: Record<ReadinessDimension, number>): SmartScorecard => ({
  impact: clamp(Math.round((dimensionScores.needClarity + dimensionScores.communityTrust) / 2), 35, 95),
  financialSustainability: clamp(dimensionScores.sustainability, 35, 95),
  ethics: clamp(Math.round((dimensionScores.communityTrust + dimensionScores.governance) / 2), 35, 95),
  risk: clamp(100 - Math.round((dimensionScores.governance + dimensionScores.goToMarket) / 2), 5, 90),
});

const buildFailureReplay = (responses: PhaseResponse[]): FailureReplayItem[] =>
  responses
    .filter((response) => response.score < 72)
    .slice(-3)
    .map((response) => ({
      phaseId: response.phaseId,
      phaseName: response.phaseName,
      issue: response.blindspots[0] || "This decision path still leaves a launch risk unresolved.",
      betterAlternative: response.mentorTip,
    }));

const buildLevel = (overall: number) => {
  if (overall >= 85) {
    return "Changemaker";
  }
  if (overall >= 75) {
    return "Systems Builder";
  }
  if (overall >= 65) {
    return "Market Tester";
  }
  return "Beginner";
};

const buildBadges = (session: EvaluationSession) => {
  const badges: string[] = [];

  if (session.scorecard.ethics >= 78) {
    badges.push("Ethical Leader");
  }
  if (session.scorecard.risk <= 32) {
    badges.push("Risk Tamer");
  }
  if (session.responses.some((response) => response.disruption)) {
    badges.push("Survivor");
  }
  if (session.scorecard.financialSustainability >= 78) {
    badges.push("Sustainability Strategist");
  }

  return unique(badges);
};

const pickDisruption = (profile: StartupProfile, phaseId: number): RealityDisruption | null => {
  if (phaseId < 2) {
    return null;
  }

  const sectorKey = profile.sector.trim().toLowerCase();
  const pool = [...(disruptionLibrary[sectorKey] || []), ...disruptionLibrary.default];
  if (pool.length === 0) {
    return null;
  }

  const difficultyBias =
    profile.difficulty === "hardcore" ? 2 : profile.difficulty === "realistic" ? 1 : 0;
  const index = (phaseId + profile.startupName.length + difficultyBias) % pool.length;
  return pool[index];
};

const updateDimensions = (
  current: Record<ReadinessDimension, number>,
  phase: EvaluationPhase,
  score: number,
) => {
  const next = { ...current };
  phase.dimensions.forEach((dimension) => {
    next[dimension] = clamp(Math.round(next[dimension] * 0.35 + score * 0.65), 35, 95);
  });
  return next;
};

const computeOverallScore = (dimensionScores: Record<ReadinessDimension, number>) =>
  Math.round(
    Object.values(dimensionScores).reduce((total, score) => total + score, 0) /
      Object.values(dimensionScores).length,
  );

export const summarizeReadiness = (session: EvaluationSession) => {
  const overall = computeOverallScore(session.dimensionScores);
  const sortedDimensions = Object.entries(session.dimensionScores).sort((a, b) => b[1] - a[1]);
  const strongest = sortedDimensions.slice(0, 2).map(([dimension]) => dimension);
  const weakest = sortedDimensions.slice(-2).map(([dimension]) => dimension);

  const readinessDecision =
    overall >= 80
      ? "Ready for pilot-scale social rollout"
      : overall >= 68
        ? "Promising, but needs targeted work before wider adoption"
        : "Not ready for public rollout yet";

  const readinessSummary =
    overall >= 80
      ? "The social venture demonstrates credible demand, a workable delivery approach, and enough execution discipline to justify a controlled pilot-scale rollout."
      : overall >= 68
        ? "The social venture has a credible mission and some readiness signals, but unresolved gaps could weaken adoption or sustainability after rollout."
        : "The social venture still needs stronger evidence, operating discipline, and clearer public adoption plans before it should scale.";

  const strengths = unique([
    ...session.responses.flatMap((response) => response.strengths),
    `Strongest dimensions: ${strongest.join(" and ")}.`,
  ]).slice(0, 4);

  const blindspots = unique([
    ...session.responses.flatMap((response) => response.blindspots),
    `Weakest dimensions: ${weakest.join(" and ")}.`,
  ]).slice(0, 4);

  const recommendedActions = unique([
    "Strengthen social-innovation scenarios with pilot metrics, founder decisions, and community evidence.",
    "Make resource allocation explicit across budget, staffing, delivery, and impact tradeoffs.",
    "Tighten stakeholder navigation with named partners, buyers, government touchpoints, and launch channels.",
    "Use an impact sustainability dashboard that links outcomes, adoption, and financial viability before launch.",
  ]).slice(0, 4);

  const scorecard = buildSmartScorecard(session.dimensionScores);
  const mentorTip =
    session.responses[session.responses.length - 1]?.mentorTip
    || "Use the mentor layer to compare short-term wins against long-term market consequences.";

  return {
    overallScore: overall,
    readinessDecision,
    readinessSummary,
    strengths,
    blindspots,
    recommendedActions,
    scorecard,
    mentorTip,
    level: buildLevel(overall),
    badges: buildBadges({
      ...session,
      overallScore: overall,
      readinessDecision,
      readinessSummary,
      strengths,
      blindspots,
      recommendedActions,
      scorecard,
      mentorTip,
    }),
    failureReplay: buildFailureReplay(session.responses),
  };
};

export const applyPhaseResponse = (session: EvaluationSession, answer: string): EvaluationSession => {
  const phase = evaluationPhases[session.currentPhaseIndex];
  if (!phase) {
    return session;
  }

  const { score } = scoreAnswer(answer, phase);
  const phaseFeedback = buildFeedback(phase, answer, score);
  const nextDimensions = updateDimensions(session.dimensionScores, phase, score);
  const mentorTip = buildMentorTip(phase, score, answer);
  const stakeholderReaction = buildStakeholderReaction(phase, score);
  const { shortTermOutcome, longTermOutcome } = buildConsequenceTimeline(phase, score, answer);
  const disruption = pickDisruption(session.profile, phase.id);
  const responses = [
    ...session.responses,
    {
      phaseId: phase.id,
      phaseName: phase.name,
      answer,
      score,
      feedback: phaseFeedback.feedback,
      strengths: phaseFeedback.strengths,
      blindspots: phaseFeedback.blindspots,
      stakeholderReaction,
      mentorTip,
      shortTermOutcome,
      longTermOutcome,
      disruption: disruption?.title ?? null,
      timestamp: new Date().toISOString(),
    },
  ];

  const nextPhaseIndex = session.currentPhaseIndex + 1;
  const nextStatus = nextPhaseIndex >= evaluationPhases.length ? "completed" : "in-progress";

  const nextSession: EvaluationSession = {
    ...session,
    responses,
    dimensionScores: nextDimensions,
    currentPhaseIndex: Math.min(nextPhaseIndex, evaluationPhases.length),
    status: nextStatus,
    activeDisruption: disruption,
    disruptionHistory: disruption ? [...session.disruptionHistory, disruption] : session.disruptionHistory,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...nextSession,
    ...summarizeReadiness(nextSession),
  };
};

export const getDimensionLabel = (dimension: ReadinessDimension) => {
  switch (dimension) {
    case "needClarity":
      return "Need Clarity";
    case "communityTrust":
      return "Community Trust";
    case "innovationFit":
      return "Innovation Fit";
    case "sustainability":
      return "Sustainability";
    case "goToMarket":
      return "Go-To-Market";
    case "governance":
      return "Governance";
  }
};
