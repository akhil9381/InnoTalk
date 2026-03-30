const PHASES = [
  {
    id: "phase-1",
    shortLabel: "Phase 1",
    title: "Intake & Feasibility Engine",
    subtitle: "Idea screening + grounded market validation",
    type: "Go / No-Go",
    summary:
      "Gemini 2.5 Flash reviews a raw social-impact concept with search-grounded signals, producing investor market trends, a readiness score, and a go/no-go verdict before any execution begins.",
    outputs: ["2026 Market Trends", "Readiness Score", "Go/No-Go Verdict"],
    tasks: [
      "Assess problem urgency, solution novelty, and stakeholder appetite.",
      "Estimate market readiness through operational, regulatory, and adoption signals.",
      "Frame the initiative in language investors can evaluate quickly."
    ],
    insight:
      "High-scoring concepts typically combine a measurable social outcome, clear unit economics, and a credible route through Indian market and compliance checkpoints.",
    trendSummary:
      "Indian impact investors in 2026 are favoring ventures that show proof of demand, compliance awareness, and lightweight pilots over broad, under-validated ambition.",
    fundingMatches: ["PRISM", "SISFS"],
    decisionCallout: "Go if the idea can prove measurable impact inside a constrained pilot budget."
  },
  {
    id: "phase-2",
    shortLabel: "Phase 2",
    title: "Strategic Roadmap Generation",
    subtitle: "7-stage execution path from POC to scale",
    type: "Roadmap",
    summary:
      "The engine turns the concept into a linear operating roadmap that maps problem discovery, stakeholder alignment, EVT/DVT/PVT readiness, crisis navigation, and mass production scale-up.",
    outputs: ["7-Stage Path", "Milestone Dependencies", "Validation Gates"],
    tasks: [
      "Sequence the initiative from POC through mass production.",
      "Tie each stage to EVT, DVT, or PVT expectations.",
      "Highlight decision gates that prevent premature scaling."
    ],
    insight:
      "Roadmap quality improves when each stage has one explicit learning objective, one measurable success metric, and one reason not to advance yet.",
    trendSummary:
      "Execution plans with discrete validation gates are outperforming visionary but non-operational decks in diligence conversations.",
    fundingMatches: ["PRISM", "SISFS", "T-PRIDE"],
    decisionCallout: "Persevere, but lock each stage behind one validation checkpoint."
  },
  {
    id: "phase-3",
    shortLabel: "Phase 3",
    title: "Ecosystem & Funding Intelligence",
    subtitle: "Sponsors, competitors, and pivot signals",
    type: "Intelligence",
    summary:
      "InnoTalk matches the venture to live-fit funding programs such as PRISM, SISFS, and T-PRIDE while analyzing competitor moves to advise whether the team should pivot, persevere, or narrow the thesis.",
    outputs: ["Sponsor Matches", "Competitor Analysis", "Pivot/Persevere Signal"],
    tasks: [
      "Map the idea to grant and accelerator channels.",
      "Read competitor movement for timing risk and differentiation pressure.",
      "Adjust strategy based on sponsor fit and market crowding."
    ],
    insight:
      "The best funding matches appear when the product thesis and regulatory burden are legible enough for grant evaluators to believe execution risk is containable.",
    trendSummary:
      "Sponsors are leaning toward founders who can connect grant fit, local ecosystem leverage, and a realistic differentiation thesis.",
    fundingMatches: ["PRISM", "T-PRIDE", "State Innovation Cells"],
    decisionCallout: "Pivot narrowly if differentiation depends only on good intent instead of execution leverage."
  },
  {
    id: "phase-4",
    shortLabel: "Phase 4",
    title: "Promotion & Influence Strategy",
    subtitle: "Distribution, messaging, and community reach",
    type: "Growth",
    summary:
      "The promotion layer generates channel-specific campaign angles and maps niche influencers, especially tech-for-good advocates, to raise trust and early adoption without burning budget inefficiently.",
    outputs: ["Promotion Concepts", "Influencer Map", "Narrative Hooks"],
    tasks: [
      "Craft audience-aware messaging for founders, communities, and funders.",
      "Identify high-trust advocates with domain relevance.",
      "Model reach efficiency against budget sensitivity."
    ],
    insight:
      "For impact products, trust compounds faster when promotions explain evidence, not just aspiration. Credibility is the growth multiplier.",
    trendSummary:
      "Trust-led distribution is beating spend-heavy campaigns, especially when a founder can show community evidence and expert validation.",
    fundingMatches: ["CSR Partnerships", "T-PRIDE", "Impact Accelerators"],
    decisionCallout: "Persevere with focused storytelling and credibility-first partnerships."
  },
  {
    id: "phase-5",
    shortLabel: "Phase 5",
    title: "Dynamic Crisis Engine",
    subtitle: "Humanoid conflict under budget, trust, and risk pressure",
    type: "Resilience",
    summary:
      "If budget drops below $5k, trust slips under 20%, or risk exceeds 70%, the simulation triggers tense cross-functional conflict between finance, technology, and community leaders to pressure-test judgment.",
    outputs: ["Crisis Scenario", "Conflicting Advice", "Stabilization Plan"],
    tasks: [
      "Escalate pressure when the business fundamentals wobble.",
      "Expose tradeoffs between runway, quality, and community trust.",
      "Train founders to make decisions under disagreement."
    ],
    insight:
      "The valley of death is rarely caused by one bad metric. It usually appears when cash, trust, and execution confidence fall together and leadership reacts too slowly.",
    trendSummary:
      "Investors are treating resilience as a core moat. Teams that respond well to adverse signals earn disproportionate confidence.",
    fundingMatches: ["Bridge Grants", "Catalytic Philanthropy", "SISFS"],
    decisionCallout: "Stabilize first. Growth is secondary until trust and runway recover together."
  },
  {
    id: "phase-6",
    shortLabel: "Phase 6",
    title: "Final Boardroom",
    subtitle: "Skeptical investor pitch simulation",
    type: "Boardroom",
    summary:
      "A sharp, skeptical venture capitalist reviews the simulation history, asks 3 to 5 high-pressure questions, and issues a blunt board score that reflects strategic clarity, defensibility, and execution maturity.",
    outputs: ["VC Questions", "Board Score", "Blunt Feedback"],
    tasks: [
      "Interrogate the founder story with investor logic.",
      "Stress-test moat, proof, and scaling assumptions.",
      "Translate the full simulation into investor readiness."
    ],
    insight:
      "Strong pitches make the hardest question feel inevitable, then answer it with evidence before the investor fully asks.",
    trendSummary:
      "Boardroom discussions increasingly focus on defensibility, founder learning velocity, and whether capital will accelerate something already working.",
    fundingMatches: ["Seed VC", "Mission-Aligned Angels", "Impact Funds"],
    decisionCallout: "Enter the room with proof, not promises. Lead with traction and constraints."
  },
  {
    id: "phase-7",
    shortLabel: "Phase 7",
    title: "Post-Simulation Intelligence",
    subtitle: "Executive synthesis and investor export",
    type: "Reporting",
    summary:
      "The final engine compiles a professional report that captures business architecture, mistake analysis, and a 2026 market roadmap, ready to be exported as a validated PDF for real-world investor conversations.",
    outputs: ["Executive Report", "Mistake Analysis", "2026 Market Roadmap"],
    tasks: [
      "Summarize the venture structure in board-ready language.",
      "Show failure points and the lessons extracted from them.",
      "Package the simulation into a practical next-step roadmap."
    ],
    insight:
      "A credible smart report is useful because it compresses weeks of founder learning into one artifact that investors can scan and challenge.",
    trendSummary:
      "The strongest post-simulation artifacts double as investor memos, internal operating guides, and compliance-aware launch plans.",
    fundingMatches: ["Institutional Grants", "Strategic CSR", "Scale Investors"],
    decisionCallout: "Package the report as an investor-facing narrative and an operating plan."
  }
];

const BOARDROOM_QUESTIONS = [
  "Why does this venture deserve to exist now, and what evidence says the problem is acute enough to fund immediately?",
  "What happens to your model if compliance takes twice as long and grant funding does not arrive on schedule?",
  "Where is the proof that communities trust your solution beyond founder enthusiasm and narrative quality?",
  "What is your unfair advantage if a better-capitalized player notices this category six months from now?"
];

const CRISIS_VOICES = {
  calm: [
    {
      role: "Finance Head",
      stance: "Watching burn",
      copy: "Runway is acceptable, but the team should treat each new feature as a budget decision, not a product reflex."
    },
    {
      role: "Tech Lead",
      stance: "Validation first",
      copy: "We can prototype leanly if compliance assumptions are clarified before deeper build work begins."
    },
    {
      role: "Community Lead",
      stance: "Trust rising",
      copy: "Early sentiment is healthy. Keep users close and document every testimonial that speaks to real-world need."
    }
  ],
  elevated: [
    {
      role: "Finance Head",
      stance: "Cash pressure",
      copy: "We are drifting toward a runway problem. Marketing spend and pilot scope need a hard review right now."
    },
    {
      role: "Tech Lead",
      stance: "Quality risk",
      copy: "If we cut too deeply, we will ship something brittle and lose trust anyway. Protect the core experience."
    },
    {
      role: "Community Lead",
      stance: "Confidence slipping",
      copy: "Beneficiaries are asking whether this is another short-term project. A weak response here will be expensive later."
    }
  ],
  critical: [
    {
      role: "Finance Head",
      stance: "Emergency mode",
      copy: "Budget has entered danger territory. Freeze non-essential work and find sponsor conversations immediately."
    },
    {
      role: "Tech Lead",
      stance: "System strain",
      copy: "Rushed tradeoffs are stacking up. If we ignore core reliability now, pilot failure becomes almost certain."
    },
    {
      role: "Community Lead",
      stance: "Trust fracture",
      copy: "The community feels over-promised and under-informed. Without direct repair, adoption will collapse before scale is possible."
    }
  ]
};

const PHASE_DRIFT = [
  { budget: -4, trust: 5, impact: 4, risk: 2, readiness: 4 },
  { budget: -3, trust: 4, impact: 5, risk: 1, readiness: 3 },
  { budget: 6, trust: 3, impact: 4, risk: 5, readiness: 4 },
  { budget: -10, trust: 8, impact: 9, risk: 4, readiness: 4 },
  { budget: -18, trust: -16, impact: 2, risk: 18, readiness: -6 },
  { budget: 4, trust: 6, impact: 5, risk: -8, readiness: 8 },
  { budget: 2, trust: 5, impact: 7, risk: -4, readiness: 6 }
];

function createHistoryEntry(title, body) {
  return { title, body, timestamp: new Date().toISOString() };
}

function createBaseSimulation() {
  return {
    activePhaseIndex: 0,
    budget: 78,
    trust: 66,
    impact: 54,
    risk: 31,
    readiness: 72,
    verdict: "Conditional",
    history: [createHistoryEntry("Simulation opened", "Baseline metrics loaded for an early-stage social innovation concept.")]
  };
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function computeVerdict(simulation) {
  if (simulation.readiness >= 78 && simulation.risk < 45) return "Go";
  if (simulation.readiness >= 60) return "Conditional";
  return "No-Go";
}

function computeCrisis(simulation) {
  let level = "calm";
  if (simulation.budget < 30 || simulation.trust < 20 || simulation.risk > 70) {
    level = "critical";
  } else if (simulation.budget < 45 || simulation.trust < 40 || simulation.risk > 55) {
    level = "elevated";
  }

  const introByLevel = {
    calm: "No hard trigger has fired yet. The system is monitoring budget, trust, and risk for early signs of founder overconfidence.",
    elevated: "Warning signals are clustering. Leadership alignment is beginning to strain under partial pressure.",
    critical: "Crisis conditions are active. The valley of death scenario is now demanding tradeoff decisions under visible tension."
  };

  return { level, intro: introByLevel[level], voices: CRISIS_VOICES[level] };
}

function computeBoardroom(simulation) {
  const score = Math.max(1, Math.min(9.8, (simulation.readiness * 0.55 + simulation.trust * 0.25 + simulation.impact * 0.2 - simulation.risk * 0.18) / 10));
  return {
    score: Number(score.toFixed(1)),
    questions: BOARDROOM_QUESTIONS,
    feedback:
      score >= 7.5
        ? "You look investable when the narrative stays anchored in proof. Keep the founder story crisp and do not hide the constraints."
        : "The concept is promising, but the board will punish ambiguity. Sharpen validation evidence, compliance readiness, and your plan for surviving the valley of death."
  };
}

function computeReport(simulation) {
  return {
    architecture:
      "An AI-native simulation stack connecting intake analysis, execution staging, ecosystem intelligence, growth strategy, crisis rehearsal, and investor evaluation inside one product loop.",
    mistakes:
      computeCrisis(simulation).level === "critical"
        ? "The core failure pattern is delayed reaction to converging budget, trust, and risk signals. Tighten scope and restore credibility before pursuing scale."
        : "Primary risks come from scaling enthusiasm faster than evidence. Preserve discipline around staged validation and founder learning cycles.",
    roadmap:
      "2026 roadmap: prove POC demand, formalize stakeholder trust signals, clear EVT/DVT gates with Indian compliance checks, secure aligned sponsorship, then approach scale once PVT economics hold."
  };
}

function serializeSimulation(simulation) {
  const normalized = { ...simulation, verdict: computeVerdict(simulation) };
  return {
    ...normalized,
    crisis: computeCrisis(normalized),
    boardroom: computeBoardroom(normalized),
    report: computeReport(normalized)
  };
}

function advanceSimulation(simulation) {
  const currentPhase = PHASES[simulation.activePhaseIndex];
  simulation.history.push(createHistoryEntry(currentPhase.shortLabel, `${currentPhase.title} completed and its outputs were added to the simulation memory.`));

  if (simulation.activePhaseIndex < PHASES.length - 1) {
    simulation.activePhaseIndex += 1;
    const drift = PHASE_DRIFT[simulation.activePhaseIndex];
    simulation.budget = clamp(simulation.budget + drift.budget);
    simulation.trust = clamp(simulation.trust + drift.trust);
    simulation.impact = clamp(simulation.impact + drift.impact);
    simulation.risk = clamp(simulation.risk + drift.risk);
    simulation.readiness = clamp(simulation.readiness + drift.readiness);
  } else {
    simulation.history.push(createHistoryEntry("Simulation complete", "The smart report is ready for export and investor review."));
  }

  simulation.verdict = computeVerdict(simulation);
  return simulation;
}

function jumpSimulation(simulation, phaseIndex) {
  simulation.activePhaseIndex = phaseIndex;
  simulation.history.push(createHistoryEntry(`Moved to ${PHASES[phaseIndex].shortLabel}`, `${PHASES[phaseIndex].title} opened from the module timeline.`));
  simulation.verdict = computeVerdict(simulation);
  return simulation;
}

function createExport(user) {
  const simulation = serializeSimulation(user.simulation);
  const phase = PHASES[simulation.activePhaseIndex];
  return [
    "INNOTALK SMART REPORT",
    "",
    `Founder: ${user.name}`,
    `Email: ${user.email}`,
    `Current module: ${phase.title}`,
    `Readiness verdict: ${simulation.verdict}`,
    `Budget: ${simulation.budget}%`,
    `Trust: ${simulation.trust}%`,
    `Impact: ${simulation.impact}%`,
    `Risk: ${simulation.risk}%`,
    `Board score: ${simulation.boardroom.score.toFixed(1)} / 10`,
    "",
    "Business architecture:",
    simulation.report.architecture,
    "",
    "Mistake analysis:",
    simulation.report.mistakes,
    "",
    "2026 roadmap:",
    simulation.report.roadmap,
    "",
    "Boardroom questions:",
    ...simulation.boardroom.questions.map((question, index) => `${index + 1}. ${question}`)
  ].join("\n");
}

module.exports = {
  PHASES,
  createBaseSimulation,
  serializeSimulation,
  advanceSimulation,
  jumpSimulation,
  createExport
};
