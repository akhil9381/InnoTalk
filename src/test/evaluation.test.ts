import { describe, expect, it } from "vitest";
import {
  applyPhaseResponse,
  createEmptySession,
  defaultDimensionScores,
  summarizeReadiness,
  type StartupProfile,
} from "@/lib/evaluation";

const profile: StartupProfile = {
  startupName: "HealthBridge",
  sector: "Health",
  geography: "Telangana",
  mission: "Improve last-mile access to preventive care.",
  beneficiaries: "Low-income families and public clinics.",
  solutionApproach: "Community health workers use mobile screening, referral support, and local trust networks to improve preventive care access.",
  model: "Clinic partnerships plus subscription support from employers and CSR programs.",
  stage: "Pilot",
};

describe("evaluation engine", () => {
  it("creates a fresh in-progress session", () => {
    const session = createEmptySession(profile);

    expect(session.status).toBe("in-progress");
    expect(session.profile.startupName).toBe("HealthBridge");
    expect(session.dimensionScores).toEqual(defaultDimensionScores);
  });

  it("applies a phase response and advances the evaluation", () => {
    const session = createEmptySession(profile);
    const next = applyPhaseResponse(
      session,
      "We interviewed 42 clinic managers, ran a pilot in 3 districts, and gathered evidence showing long wait times, low screening rates, and high demand for trusted mobile outreach.",
    );

    expect(next.responses).toHaveLength(1);
    expect(next.currentPhaseIndex).toBe(1);
    expect(next.overallScore).toBeGreaterThan(52);
  });

  it("summarizes readiness for a strong completed session", () => {
    let session = createEmptySession(profile);

    for (const answer of [
      "We validated the problem with district data, 40 interviews, and pilot evidence from community health workers.",
      "Two NGO partners and one public hospital agreed to pilot, and adoption barriers were tested with beneficiary groups.",
      "The workflow works offline, uses low-cost Android devices, and tracks appointment completion and follow-up outcomes.",
      "Revenue comes from hospital subscriptions, CSR-backed outreach contracts, and phased pricing to reduce grant dependence.",
      "Launch starts with three anchor districts, two implementation partners, and a structured 90-day rollout plan.",
      "We mapped compliance, safeguarding, staffing, and contingency risks with documented fallback plans.",
      "Impact is tracked through baseline screening coverage, patient retention, referral completion, and cost per beneficiary reached.",
      "The startup is ready for market entry because pilot traction, named partners, and a disciplined rollout model already exist.",
    ]) {
      session = applyPhaseResponse(session, answer);
    }

    const summary = summarizeReadiness(session);

    expect(session.status).toBe("completed");
    expect(summary.overallScore).toBeGreaterThanOrEqual(60);
    expect(summary.readinessDecision.length).toBeGreaterThan(0);
  });
});
