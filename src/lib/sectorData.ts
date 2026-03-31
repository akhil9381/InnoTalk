export type SectorDataset = {
  ruralChallenges: string[];
  urbanChallenges: string[];
  costStructures: string[];
  failureStats: string[];
};

export const sectorDatasets: Record<string, SectorDataset> = {
  education: {
    ruralChallenges: [
      "Teacher shortage and uneven classroom support",
      "Low-device access and patchy connectivity",
      "Parent trust depends on school leadership endorsement",
    ],
    urbanChallenges: [
      "High competition from low-cost alternatives",
      "Demand for measurable learning outcomes quickly",
      "School procurement cycles can delay adoption",
    ],
    costStructures: [
      "Teacher onboarding and training support",
      "Offline-first product maintenance",
      "Monitoring and learning assessment operations",
    ],
    failureStats: [
      "Many pilots stall when teacher workload rises without clear savings",
      "Retention falls when evidence of learning improvement is weak",
      "Expansion slows when one district champion leaves",
    ],
  },
  healthcare: {
    ruralChallenges: [
      "Referral follow-up is hard across scattered communities",
      "Frontline workers have limited time for new workflows",
      "Trust depends on clinic and local health-worker credibility",
    ],
    urbanChallenges: [
      "Users compare against fast private alternatives",
      "Data privacy concerns surface earlier",
      "Hospital procurement may require lengthy approvals",
    ],
    costStructures: [
      "Field operations and screening staff",
      "Clinical validation and compliance processes",
      "Referral tracking and partner integration",
    ],
    failureStats: [
      "Startups struggle when consent and data governance are vague",
      "Growth becomes expensive if follow-up rates stay low",
      "Institutional pilots often fail without a strong care partner",
    ],
  },
  environment: {
    ruralChallenges: [
      "Adoption depends on livelihoods not being disrupted",
      "Local leaders influence trust more than marketing",
      "Field maintenance capacity is often thin",
    ],
    urbanChallenges: [
      "Decision-makers expect visible ROI and compliance quickly",
      "Competition from commercial sustainability providers is high",
      "Public backlash can spread fast when benefits are unclear",
    ],
    costStructures: [
      "Field deployment and maintenance",
      "Community engagement and behavior change",
      "Measurement and reporting for impact claims",
    ],
    failureStats: [
      "Projects lose trust when local incentives are ignored",
      "Scale stalls when regulation changes mid-rollout",
      "Unit economics weaken if service delivery is too customized",
    ],
  },
  default: {
    ruralChallenges: [
      "Adoption depends on trusted intermediaries",
      "Infrastructure and staffing are more constrained",
      "Behavior change often needs longer field support",
    ],
    urbanChallenges: [
      "Competition and expectation levels are higher",
      "Stakeholders want faster proof and clearer differentiation",
      "Compliance and reputation risks are more visible earlier",
    ],
    costStructures: [
      "Partner onboarding and field support",
      "Monitoring, evaluation, and reporting",
      "Product adaptation for constrained environments",
    ],
    failureStats: [
      "Pilots fail when there is no clear owner on the partner side",
      "Mission-driven ventures stall when pricing logic stays vague",
      "Public rollout weakens if trust-building is treated as marketing only",
    ],
  },
};
