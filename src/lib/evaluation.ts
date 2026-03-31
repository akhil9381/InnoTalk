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
  juryMode: boolean;
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
  roadmap: Array<{
    title: string;
    timeline: string;
    focus: string;
  }>;
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
    prompt: "If an impact investor asked whether this social innovation is addressing a problem strong enough to justify market entry, what evidence would you use to prove the need is urgent, real, and worth funding now?",
    guidance: "Answer like you are defending a market-facing social entrepreneurship case. Be specific about the affected community, lived pain, urgency, and proof that this is more than a good intention.",
    placeholder: "Answer as if an impact investor is challenging whether this social innovation is strong enough and credible enough to enter the market...",
    agentName: "Impact Investor",
    agentRole: "Urgency and investability review",
    keywords: ["problem", "evidence", "community", "beneficiary", "data", "urgent", "research", "investor", "demand", "pain"],
    dimensions: ["needClarity", "communityTrust"],
  },
  {
    id: 2,
    name: "Customer Reaction",
    shortLabel: "Customer",
    prompt: "If the end beneficiary, community member, or frontline institution saw this social innovation as it enters the market, what would make them trust it, try it, and keep using it, and what would make them reject it immediately?",
    guidance: "Answer from the beneficiary and community point of view. Reference interviews, pilots, objections, trust barriers, affordability, accessibility, and adoption signals that affect market adoption.",
    placeholder: "Describe how real beneficiaries, communities, or frontline institutions would react when this social innovation reaches the market, what builds trust, and what causes rejection...",
    agentName: "End Customer Panel",
    agentRole: "Customer trust and adoption review",
    keywords: ["pilot", "interview", "trust", "school", "hospital", "ngo", "partner", "feedback", "adoption", "customer", "beneficiary", "reject"],
    dimensions: ["communityTrust", "goToMarket"],
  },
  {
    id: 3,
    name: "Field Reality Test",
    shortLabel: "Field",
    prompt: "If a field operator told you, 'Your innovation sounds good, but we do not have the budget, staff, devices, or infrastructure to run this at market level,' how would you prove the solution is still practical?",
    guidance: "Focus on real operating constraints, difficult tradeoffs, delivery feasibility, resource allocation, and what the minimum market-ready version looks like in the field.",
    placeholder: "Explain how the social innovation still works when money, devices, staffing, and infrastructure are limited in the real market...",
    agentName: "Field Operator",
    agentRole: "Operational feasibility review",
    keywords: ["offline", "training", "feasible", "prototype", "device", "workflow", "measure", "outcomes", "budget", "staff", "allocate", "resources", "field"],
    dimensions: ["innovationFit", "goToMarket"],
  },
  {
    id: 4,
    name: "Payer and Funder Review",
    shortLabel: "Payer",
    prompt: "If a payer, grantmaker, CSR program, or public procurement team asked, 'Who exactly funds or pays for this social innovation once it enters the market, why would they keep supporting it, and how do we know the mission will not drift once revenue pressure starts?' what would you say?",
    guidance: "Clarify payer logic, grants, procurement, cross-subsidy, repeat support, and how mission protection is built into the market model.",
    placeholder: "Explain who funds or pays for the social innovation after market entry, why support continues, and how the mission stays protected...",
    agentName: "Funder Committee",
    agentRole: "Revenue and mission-protection review",
    keywords: ["revenue", "pricing", "grant", "csr", "subscription", "margin", "sustainable", "funding", "procurement", "payer"],
    dimensions: ["sustainability", "needClarity"],
  },
  {
    id: 5,
    name: "Mission Innovation Fit",
    shortLabel: "Mission Fit",
    prompt: "What makes this a mission-driven social venture with a genuinely innovative approach, and why is that combination strong enough to justify responsible market entry now?",
    guidance: "Show what is distinctive about the venture, how the innovation serves a social mission, why it is not just a standard product, and how that difference matters in the market.",
    placeholder: "Explain what makes this venture mission-driven, what is innovative about the approach, and why that combination is strong enough for market entry...",
    agentName: "Mission Innovation Review",
    agentRole: "Mission-driven innovation and market-fit review",
    keywords: ["mission-driven", "social venture", "innovation", "distinctive", "novel", "impact model", "public value", "market relevance", "beneficiary", "difference", "responsible scale", "social entrepreneurship"],
    dimensions: ["innovationFit", "communityTrust"],
  },
  {
    id: 6,
    name: "Policy and Risk Interference",
    shortLabel: "Policy",
    prompt: "What government policies, compliance rules, safeguarding requirements, or reputational risks could interfere with taking this social innovation to market, and what safeguards do you have if one of them hits early?",
    guidance: "Answer like a regulator or policy reviewer is scrutinizing the launch. Call out approvals, legal exposure, compliance duties, operational risks, and fallback plans that protect market readiness.",
    placeholder: "Explain the policies, compliance issues, reputational risks, and operational safeguards that could affect market launch...",
    agentName: "Policy Reviewer",
    agentRole: "Policy, compliance, and resilience review",
    keywords: ["risk", "policy", "compliance", "safeguarding", "fallback", "operations", "contingency", "staffing", "government", "regulation", "approval"],
    dimensions: ["governance", "sustainability"],
  },
  {
    id: 7,
    name: "Proof for Scale",
    shortLabel: "Proof",
    prompt: "If an impact investor, beneficiary institution, and public-sector partner all asked for proof at the same time, what metrics and evaluation signals would convince them that the social innovation creates measurable value and is ready for responsible market scale?",
    guidance: "Include adoption, retention, trust, social outcomes, efficiency, evidence quality, and the signals that different social-innovation stakeholders would each care about before supporting market growth.",
    placeholder: "Describe the proof points that would convince impact investors, beneficiary institutions, and public partners that this works and is ready for responsible market scale...",
    agentName: "Evidence Panel",
    agentRole: "Proof and readiness review",
    keywords: ["metrics", "impact", "outcomes", "retention", "evidence", "baseline", "measurement", "data", "investor", "customer", "partner"],
    dimensions: ["needClarity", "innovationFit", "governance"],
  },
  {
    id: 8,
    name: "Market Readiness Panel",
    shortLabel: "Decision",
    prompt: "Why is this social venture ready to enter the market now, and what would convince an impact investor, an end beneficiary or institution, and a strategic or government partner that you can execute responsibly?",
    guidance: "Make the case across three social entrepreneurship lenses at once: impact confidence, beneficiary reaction, and institutional or policy readiness for market entry.",
    placeholder: "Make the final case for why the social venture is ready for market entry now and why key stakeholders should trust the rollout...",
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
  roadmap: [],
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

const normalizeStartupProfile = (profile: Partial<StartupProfile> | undefined): StartupProfile => ({
  startupName: profile?.startupName || "",
  sector: profile?.sector || "",
  geography: profile?.geography || "",
  mission: profile?.mission || "",
  beneficiaries: profile?.beneficiaries || "",
  solutionApproach: profile?.solutionApproach || "",
  model: profile?.model || "",
  stage: profile?.stage || "",
  difficulty: profile?.difficulty || "realistic",
  evaluationMode: profile?.evaluationMode || "reality-engine",
  juryMode: profile?.juryMode ?? false,
});

export const normalizeSession = (session: Partial<EvaluationSession>): EvaluationSession => {
  const profile = normalizeStartupProfile(session.profile);
  const baseSession: EvaluationSession = {
    ...createEmptySession(profile),
    ...session,
    profile,
    responses: (session.responses || []).map((response) => ({
      phaseId: response.phaseId || 0,
      phaseName: response.phaseName || "Unknown Phase",
      answer: response.answer || "",
      score: response.score || 0,
      feedback: response.feedback || "",
      strengths: response.strengths || [],
      blindspots: response.blindspots || [],
      stakeholderReaction:
        response.stakeholderReaction || "Stakeholders need a clearer view before they fully support this path.",
      mentorTip:
        response.mentorTip || "Add one stronger proof point and one fallback to improve this decision.",
      shortTermOutcome:
        response.shortTermOutcome || "This choice changes how stakeholders view current readiness.",
      longTermOutcome:
        response.longTermOutcome || "This choice will influence trust and scale readiness over time.",
      disruption: response.disruption ?? null,
      timestamp: response.timestamp || new Date().toISOString(),
    })),
    dimensionScores: {
      ...defaultDimensionScores,
      ...(session.dimensionScores || {}),
    },
    createdAt: session.createdAt || new Date().toISOString(),
    updatedAt: session.updatedAt || new Date().toISOString(),
    activeDisruption: session.activeDisruption || null,
    disruptionHistory: session.disruptionHistory || [],
  };

  return {
    ...baseSession,
    ...summarizeReadiness(baseSession),
  };
};

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
  if (phase.id === 5 && /(innovation|distinct|mission|social venture|public value|novel)/.test(normalized)) {
    strengths.push("Explained why the venture is genuinely mission-driven and not just a generic market product.");
  }
  if (phase.id === 5 && /(innovation|distinct|mission|social venture|public value|novel)/.test(normalized) && /(market|adoption|scale|customer|beneficiar)/.test(normalized)) {
    strengths.push("Connected the social innovation story to real market relevance and adoption logic.");
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
  if (phase.id === 5 && !/(innovation|distinct|mission|social venture|public value|novel)/.test(normalized)) {
    blindspots.push("It is still unclear what makes this a distinctive social venture rather than a standard solution.");
  }
  if (phase.id === 5 && !/(market|adoption|customer|beneficiar|buyer|scale)/.test(normalized)) {
    blindspots.push("The answer does not yet show why this mission-driven innovation is strong enough for the market.");
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

const formatWeaknessTheme = (dimension: ReadinessDimension) => {
  switch (dimension) {
    case "needClarity":
      return "problem proof and evidence strength";
    case "communityTrust":
      return "community trust and adoption confidence";
    case "innovationFit":
      return "field practicality and solution fit";
    case "sustainability":
      return "financial sustainability and payer logic";
    case "goToMarket":
      return "rollout sequencing and stakeholder navigation";
    case "governance":
      return "policy readiness and operating safeguards";
  }
};

const buildDynamicBlindspots = (
  session: EvaluationSession,
  weakest: ReadinessDimension[],
) => {
  const profile = session.profile;
  const latestResponses = session.responses.slice(-3);
  const fromResponses = unique(
    latestResponses.flatMap((response) => response.blindspots).filter(Boolean),
  ).slice(0, 2);

  const dimensionGaps = weakest.map((dimension) => {
    switch (dimension) {
      case "needClarity":
        return `${profile.startupName} still needs sharper local proof that the problem is urgent for ${profile.beneficiaries.toLowerCase()}.`;
      case "communityTrust":
        return `Trust-building is still underdeveloped for ${profile.beneficiaries.toLowerCase()}, especially in ${profile.geography}.`;
      case "innovationFit":
        return `The current ${profile.solutionApproach.toLowerCase()} model needs more field evidence that it works under real operating constraints.`;
      case "sustainability":
        return `The funding and operating model for ${profile.startupName} is not yet specific enough to show long-term sustainability.`;
      case "goToMarket":
        return `The rollout path in ${profile.geography} still needs clearer partner sequencing, adoption triggers, and launch ownership.`;
      case "governance":
        return `Policy, compliance, or safeguarding exposure could still interfere with making ${profile.startupName} public too early.`;
    }
  });

  return unique([...fromResponses, ...dimensionGaps]).slice(0, 4);
};

const buildDynamicStrengths = (
  session: EvaluationSession,
  strongest: string[],
) => {
  const profile = session.profile;
  const latestResponses = session.responses.slice(-3);
  const fromResponses = unique(
    latestResponses.flatMap((response) => response.strengths).filter(Boolean),
  ).slice(0, 2);

  const dimensionStrengths = strongest.map((dimension) => {
    switch (dimension as ReadinessDimension) {
      case "needClarity":
        return `${profile.startupName} shows a clear case for why the problem matters for ${profile.beneficiaries.toLowerCase()}.`;
      case "communityTrust":
        return `The venture shows promising trust and adoption potential for its target community in ${profile.geography}.`;
      case "innovationFit":
        return `The ${profile.solutionApproach.toLowerCase()} approach looks meaningfully aligned with the realities of the problem.`;
      case "sustainability":
        return `${profile.startupName} presents a more credible sustainability path than many early social ventures at this stage.`;
      case "goToMarket":
        return `The rollout logic for ${profile.geography} is becoming clearer and more market-ready.`;
      case "governance":
        return `The venture is showing stronger awareness of policy, compliance, and responsible market entry safeguards.`;
    }
  });

  const modeStrength =
    profile.evaluationMode === "pitch-evaluator"
      ? `The pitch for ${profile.startupName} is increasingly shaped for external investor, partner, and institution review.`
      : `${profile.startupName} is being framed as a social innovation that can be marketed responsibly rather than just a promising idea.`;

  return unique([...fromResponses, ...dimensionStrengths, modeStrength]).slice(0, 4);
};

const buildDynamicRecommendations = (
  session: EvaluationSession,
  weakest: ReadinessDimension[],
) => {
  const profile = session.profile;
  const recommendations = weakest.map((dimension) => {
    switch (dimension) {
      case "needClarity":
        return `Collect stronger interviews, pilot data, or baseline evidence showing why ${profile.beneficiaries.toLowerCase()} need this now in ${profile.geography}.`;
      case "communityTrust":
        return `Use a trusted intermediary, anchor partner, or beneficiary pilot to improve confidence in ${profile.solutionApproach.toLowerCase()}.`;
      case "innovationFit":
        return `Simplify the delivery model so ${profile.startupName} can operate with lower budget, staffing, or device dependency.`;
      case "sustainability":
        return `Clarify who pays for ${profile.model.toLowerCase()} and what keeps the model alive if grants or sponsors slow down.`;
      case "goToMarket":
        return `Map the first institutions, NGOs, buyers, or public actors who can unblock adoption in ${profile.geography}, then sequence rollout around them.`;
      case "governance":
        return `Document the approvals, safeguarding safeguards, and fallback plans needed before wider rollout of ${profile.startupName}.`;
    }
  });

  if (profile.evaluationMode === "pitch-evaluator") {
    recommendations.unshift(
      `Refine the external pitch so it clearly explains feasibility, risks, and why ${profile.startupName} is ready for partner review right now.`,
    );
  } else {
    recommendations.unshift(
      `Run another decision round focused on ${formatWeaknessTheme(weakest[0] || "needClarity")} before pushing toward a wider launch.`,
    );
  }

  return unique(recommendations).slice(0, 4);
};

const getSectorTactic = (profile: StartupProfile) => {
  const sector = profile.sector.toLowerCase();

  if (sector.includes("health")) {
    return "with clinic workflows, referral pathways, consent handling, and frontline health-worker adoption in mind";
  }
  if (sector.includes("education")) {
    return "with teacher workload, school approval cycles, parent trust, and classroom practicality in mind";
  }
  if (sector.includes("environment")) {
    return "with community buy-in, local livelihood impact, and public-perception risk in mind";
  }
  if (sector.includes("livelihood")) {
    return "with income predictability, partner trust, and on-ground adoption barriers in mind";
  }
  if (sector.includes("civic")) {
    return "with public-system integration, policy exposure, and institutional credibility in mind";
  }

  return "with the real operating constraints of the target market in mind";
};

const getStageTactic = (profile: StartupProfile) => {
  const stage = profile.stage.toLowerCase();

  if (stage.includes("idea") || stage.includes("concept")) {
    return "Focus on proving the core assumptions before trying to scale.";
  }
  if (stage.includes("pilot")) {
    return "Turn the pilot into evidence that can justify broader market confidence.";
  }
  if (stage.includes("revenue") || stage.includes("traction")) {
    return "Use current traction to prove repeatability rather than just early momentum.";
  }
  if (stage.includes("growth") || stage.includes("expan")) {
    return "Prioritize repeatability and governance so growth does not outrun operational readiness.";
  }

  return "Translate the current stage into one clear proof point that supports the next market milestone.";
};

const getLatestAnswerSignal = (session: EvaluationSession) => {
  const latestAnswer = session.responses[session.responses.length - 1]?.answer || "";
  const cleaned = latestAnswer
    .replace(/Stakeholder:\s*/gi, "")
    .replace(/Scenario:\s*/gi, "")
    .replace(/Question:\s*/gi, "")
    .replace(/Chosen option:\s*/gi, "")
    .replace(/Expected consequence:\s*/gi, "")
    .replace(/Founder answer:\s*/gi, "")
    .trim();

  return cleaned.slice(0, 180);
};

const buildGapAction = (gap: string, profile: StartupProfile, session: EvaluationSession) => {
  const normalized = gap.toLowerCase();
  const sectorTactic = getSectorTactic(profile);
  const stageTactic = getStageTactic(profile);
  const answerSignal = getLatestAnswerSignal(session);

  if (normalized.includes("evidence") || normalized.includes("proof") || normalized.includes("baseline")) {
    return `Run 10-15 focused interviews or field visits in ${profile.geography}, capture baseline data tied to ${profile.beneficiaries.toLowerCase()}, and convert it into a one-page proof pack for ${profile.startupName}. ${stageTactic}`;
  }
  if (normalized.includes("trust") || normalized.includes("adoption") || normalized.includes("benefici")) {
    return `Pilot ${profile.solutionApproach.toLowerCase()} through one trusted intermediary in ${profile.geography}, document the top three objections, and revise the onboarding or outreach flow ${sectorTactic}.`;
  }
  if (normalized.includes("sustainability") || normalized.includes("funding") || normalized.includes("payer") || normalized.includes("economics")) {
    return `Model who pays, how often they pay, and what delivery costs look like for ${profile.startupName}. Then stress-test the plan against one delayed grant, slower contract cycle, or lower-than-expected adoption scenario.`;
  }
  if (normalized.includes("rollout") || normalized.includes("go-to-market") || normalized.includes("stakeholder") || normalized.includes("launch")) {
    return `Create a launch map for ${profile.geography} with named institutions, champions, blockers, and the order in which each stakeholder should be engaged. Use your recent answer about "${answerSignal}" to decide what has to be proven before public rollout.`;
  }
  if (normalized.includes("policy") || normalized.includes("compliance") || normalized.includes("safeguarding") || normalized.includes("approval")) {
    return `List the approvals, safeguarding steps, and public-risk checks required before market entry, assign an owner and timeline to each one, and verify which of them are specific to ${profile.geography}.`;
  }
  if (normalized.includes("field") || normalized.includes("practical") || normalized.includes("resource") || normalized.includes("infrastructure")) {
    return `Strip ${profile.solutionApproach.toLowerCase()} down to a minimum viable field model and test whether it still works with limited staff, budget, or devices ${sectorTactic}.`;
  }
  if (normalized.includes("distinctive") || normalized.includes("standard solution") || normalized.includes("mission-driven") || normalized.includes("social venture") || normalized.includes("innovation")) {
    return `Write a short differentiation note for ${profile.startupName} that compares the venture against standard alternatives, clarifies the mission logic, and shows why the innovation creates both public value and market relevance. Test that note with one founder mentor and one likely market stakeholder.`;
  }

  return `Turn this gap into one concrete validation sprint for ${profile.startupName}, assign an owner, define success criteria, and review the evidence before the next market decision. ${stageTactic}`;
};

const buildRoadmap = (
  session: EvaluationSession,
  weakest: ReadinessDimension[],
) => {
  const profile = session.profile;
  const gapPool = unique([
    ...session.blindspots,
    ...session.responses.slice(-4).flatMap((response) => response.blindspots),
  ]).filter(Boolean);

  const prioritizedGaps = gapPool.slice(0, 3);
  const fallbackGaps = weakest.map((dimension) => {
    switch (dimension) {
      case "needClarity":
        return `Problem validation is still too weak for confident market entry.`;
      case "communityTrust":
        return `Community trust and adoption confidence still need work.`;
      case "innovationFit":
        return `The solution still needs stronger proof of field practicality.`;
      case "sustainability":
        return `The venture still needs a stronger sustainability and payer model.`;
      case "goToMarket":
        return `The rollout and stakeholder plan is not yet market-ready.`;
      case "governance":
        return `Policy and compliance readiness still need to be closed before launch.`;
    }
  });

  const roadmapGaps = unique([...prioritizedGaps, ...fallbackGaps]).slice(0, 3);

  return roadmapGaps.map((gap, index) => ({
    title:
      index === 0
        ? `${profile.startupName} priority gap`
        : index === 1
          ? `${profile.sector} validation step`
          : `${profile.geography} market milestone`,
    timeline:
      index === 0
        ? "Next 30 days"
        : index === 1
          ? "30-60 days"
          : "60-90 days",
    focus: `${gap} ${buildGapAction(gap, profile, session)}`,
  })).concat(
    roadmapGaps.length < 3
      ? [{
          title: `${profile.startupName} market-readiness milestone`,
          timeline: "60-90 days",
          focus:
            profile.evaluationMode === "pitch-evaluator"
              ? `Prepare an external pitch, partner brief, and evidence pack that show why ${profile.startupName} is ready for responsible support.`
              : `Run a controlled market-entry milestone for ${profile.startupName} with named partners, tracked outcomes, and a clear fallback plan.`,
        }]
      : [],
  ).slice(0, 3);
};

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
  if (session.scorecard.risk >= 60) {
    badges.push("Risk Taker");
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
  const weakest = sortedDimensions.slice(-2).map(([dimension]) => dimension as ReadinessDimension);

  const readinessDecision =
    session.profile.evaluationMode === "pitch-evaluator"
      ? overall >= 80
        ? "Pitch is strong enough for partner and funder conversations"
        : overall >= 68
          ? "Pitch shows promise, but execution concerns remain"
          : "Pitch is not strong enough for external review yet"
      : overall >= 80
        ? "Ready for pilot-scale social rollout"
        : overall >= 68
          ? "Promising, but needs targeted work before wider adoption"
          : "Not ready for public rollout yet";

  const readinessSummary =
    session.profile.evaluationMode === "pitch-evaluator"
      ? overall >= 80
        ? "The venture pitch now presents a credible combination of problem clarity, feasibility, stakeholder fit, and responsible scale logic."
        : overall >= 68
          ? "The pitch has a believable direction, but investor, customer, or policy questions would still expose important gaps."
          : "The pitch still needs much stronger evidence, realism, and stakeholder readiness before it should be used externally."
      : overall >= 80
        ? "The social venture demonstrates credible demand, a workable delivery approach, and enough execution discipline to justify a controlled pilot-scale rollout."
        : overall >= 68
          ? "The social venture has a credible mission and some readiness signals, but unresolved gaps could weaken adoption or sustainability after rollout."
          : "The social venture still needs stronger evidence, operating discipline, and clearer public adoption plans before it should scale.";

  const strengths = buildDynamicStrengths(session, strongest);

  const blindspots = buildDynamicBlindspots(session, weakest);
  const recommendedActions = buildDynamicRecommendations(session, weakest);

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
    roadmap: buildRoadmap(session, weakest),
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
