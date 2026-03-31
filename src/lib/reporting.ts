import type { EvaluationSession } from "@/lib/evaluation";

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const buildVerificationCode = (session: EvaluationSession) =>
  `INNO-${session.id.slice(-6).toUpperCase()}-${session.overallScore}`;

export const buildShareSummary = (session: EvaluationSession) =>
  `${session.profile.startupName} completed the InnoTalk social startup evaluation with a readiness score of ${session.overallScore}/100. Decision: ${session.readinessDecision}.`;

export const buildArtifactContent = (
  session: EvaluationSession,
  artifact: "brief" | "deck" | "resource-plan" | "dashboard" | "certificate",
) => {
  const lines = [
    `Startup: ${session.profile.startupName}`,
    `Sector: ${session.profile.sector}`,
    `Geography: ${session.profile.geography}`,
    `Readiness Score: ${session.overallScore}/100`,
    `Decision: ${session.readinessDecision}`,
    "",
  ];

  if (artifact === "certificate") {
    return [
      "InnoTalk Market Readiness Certificate",
      "-----------------------------------",
      ...lines,
      `Verification Code: ${buildVerificationCode(session)}`,
      "",
      "This certificate summarizes the latest local evaluation outcome.",
    ].join("\n");
  }

  if (artifact === "deck") {
    return [
      "Stakeholder Navigation Deck",
      "---------------------------",
      ...lines,
      "Key Strengths:",
      ...session.strengths.map((item) => `- ${item}`),
      "",
      "Critical Gaps:",
      ...session.blindspots.map((item) => `- ${item}`),
    ].join("\n");
  }

  if (artifact === "resource-plan") {
    return [
      "Resource Allocation Plan",
      "------------------------",
      ...lines,
      "Recommended Actions:",
      ...session.recommendedActions.map((item) => `- ${item}`),
      "",
      "Roadmap:",
      ...session.roadmap.map((item) => `- ${item.timeline}: ${item.title} - ${item.focus}`),
      "",
      `Impact Score: ${session.scorecard.impact}`,
      `Financial Sustainability: ${session.scorecard.financialSustainability}`,
      `Ethics Score: ${session.scorecard.ethics}`,
      `Risk Index: ${session.scorecard.risk}`,
    ].join("\n");
  }

  if (artifact === "dashboard") {
    return [
      "Impact Sustainability Dashboard Export",
      "-------------------------------------",
      ...lines,
      ...Object.entries(session.dimensionScores).map(([key, value]) => `${key}: ${value}`),
      "",
      `Impact Score: ${session.scorecard.impact}`,
      `Financial Sustainability: ${session.scorecard.financialSustainability}`,
      `Ethics Score: ${session.scorecard.ethics}`,
      `Risk Index: ${session.scorecard.risk}`,
    ].join("\n");
  }

  return [
    "Market Readiness Brief",
    "----------------------",
    ...lines,
    "Summary:",
    session.readinessSummary,
    "",
    "Top Strengths:",
    ...session.strengths.map((item) => `- ${item}`),
    "",
    "Critical Gaps:",
    ...session.blindspots.map((item) => `- ${item}`),
    "",
    "Guidance and Roadmap:",
    ...session.roadmap.map((item) => `- ${item.timeline}: ${item.title} - ${item.focus}`),
  ].join("\n");
};

export const downloadArtifact = (
  session: EvaluationSession,
  artifact: "brief" | "deck" | "resource-plan" | "dashboard" | "certificate",
) => {
  const fileMap = {
    brief: "market-readiness-brief.txt",
    deck: "stakeholder-navigation-deck.txt",
    "resource-plan": "resource-allocation-plan.txt",
    dashboard: "impact-sustainability-dashboard.txt",
    certificate: "market-readiness-certificate.txt",
  } as const;

  downloadTextFile(fileMap[artifact], buildArtifactContent(session, artifact));
};
