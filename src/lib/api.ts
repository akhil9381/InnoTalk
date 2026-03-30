export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3001";

type EvaluationQuestionRequest = {
  phase: {
    id: number;
    name: string;
    prompt: string;
    guidance: string;
    dimensions: string[];
  };
  startupProfile: {
    startupName: string;
    sector: string;
    geography: string;
    mission: string;
    beneficiaries: string;
    solutionApproach: string;
    model: string;
    stage: string;
  };
  previousResponses: Array<{
    phaseId: number;
    phaseName: string;
    answer: string;
    score: number;
    feedback: string;
  }>;
};

export type EvaluationQuestionResponse = {
  stakeholder: string;
  scenario: string;
  question: string;
  guidance: string;
  rationale: string;
  options: Array<{
    id: string;
    label: string;
    consequence: string;
    scoreHint: number;
  }>;
  allowOther: boolean;
  source: "gemini" | "fallback";
};

export const fetchEvaluationQuestion = async (
  payload: EvaluationQuestionRequest,
): Promise<EvaluationQuestionResponse> => {
  const response = await fetch(`${apiBaseUrl}/api/ai/evaluation-question`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Question request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data as EvaluationQuestionResponse;
};
