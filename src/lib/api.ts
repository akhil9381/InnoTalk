export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3001";

export type AuthUser = {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  role: string;
  isActive: boolean;
  security?: {
    emailVerified?: boolean;
    lastLogin?: string;
  };
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginRole = "user" | "mentor";

type AuthResponse = {
  message: string;
  user: AuthUser;
  tokens: AuthTokens;
};

export type SimulationFlowMetrics = {
  readiness: number;
  impact: number;
  sustainability: number;
  risk: number;
  ethics: number;
  technical: number;
  regulatory: number;
  execution: number;
};

export type SimulationScenarioPayload = {
  sessionId: string;
  status: string;
  currentScenario: {
    phase: number;
    phaseName: string;
    description: string;
    prompt: string;
    stakeholders: Array<{
      id: string;
      label: string;
    }>;
    recommendedOptions: Array<{
      id: string;
      label: string;
      expectedEffect: string;
      scoreBias: string;
    }>;
    lastDecision: {
      answer: string;
      score: number;
      feedback: string;
    } | null;
  };
  metrics: SimulationFlowMetrics;
  notifications: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  progress: {
    completedPhases: number;
    totalPhases: number;
    percentComplete: number;
  };
  history: Array<{
    agent: string;
    question: string;
    answer: string;
    score: number | null;
    feedback: string;
    timestamp: string;
  }>;
};

export type SimulationReportPayload = {
  sessionId: string;
  startup: {
    name: string;
    industry: string;
    geography: string;
    businessModel: string;
  };
  summary: {
    readinessDecision: string;
    completedAt: string | null;
    currentPhase: number;
    currentPhaseName: string;
  };
  scores: SimulationFlowMetrics;
  strengths: Array<{
    phase: number;
    type: string;
    description: string;
    agent: string;
  }>;
  risks: Array<{
    phase: number;
    type: string;
    description: string;
    agent: string;
  }>;
  timeline: Array<{
    timestamp: string;
    phase: number;
    score: number;
  }>;
  recommendations: string[];
  artifacts: Record<string, unknown>;
  notifications: Array<{
    type: string;
    title: string;
    description: string;
  }>;
};

export type StartSimulationRequest = {
  startupName?: string;
  sector?: string;
  geography?: string;
  stage?: string;
  mission?: string;
  problem?: string;
  beneficiaries?: string;
  solutionApproach?: string;
  operatingModel?: string;
  model?: string;
  marketSize?: string;
  devilAdvocateMode?: boolean;
  language?: "english" | "telugu" | "hindi" | "tamil" | "kannada";
};

export type NextStepRequest = {
  sessionId: string;
  decision: string;
  selectedOptionId?: string;
  stakeholder?: string;
  consequence?: string;
  question?: string;
};

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
    difficulty?: string;
    evaluationMode?: string;
    juryMode?: boolean;
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

export type MentorDirectoryEntry = {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  bio: string;
  expertise: string[];
  company: string;
  designation: string;
  rating: number;
};

export type MentorConversationSummary = {
  conversationId: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
  };
  mentor: {
    _id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    expertise: string[];
    company: string;
    designation: string;
  };
  latestMessage: {
    id: string;
    senderRole: "user" | "mentor";
    senderName: string;
    message: string;
    createdAt: string;
  };
  unreadCount: number;
};

export type MentorConversationDetail = {
  messages: Array<{
    _id: string;
    message: string;
    senderRole: "user" | "mentor";
    senderName: string;
    createdAt: string;
  }>;
  participants: {
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      fullName?: string;
      email: string;
    };
    mentor: {
      _id: string;
      firstName: string;
      lastName: string;
      fullName?: string;
      email: string;
      expertise: string[];
      company: string;
      designation: string;
    };
  } | null;
};

export type EvaluationStatePayload = {
  sessions: unknown[];
  activeSessionId: string | null;
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

const parseApiError = async (response: Response) => {
  try {
    const data = await response.json();
    return data.message || data.error || "Request failed";
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

export const registerUser = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: LoginRole;
}): Promise<AuthResponse> => {
  const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as AuthResponse;
};

export const loginUser = async (payload: {
  email: string;
  password: string;
  loginAs: LoginRole;
}): Promise<AuthResponse> => {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as AuthResponse;
};

export const fetchCurrentUser = async (token: string): Promise<AuthUser> => {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { user: AuthUser };
  return data.user;
};

export const logoutUser = async (token: string) => {
  const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
};

export const fetchScenario = async (
  sessionId: string,
  token: string,
): Promise<SimulationScenarioPayload> => {
  const response = await fetch(`${apiBaseUrl}/api/scenario/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Scenario request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data as SimulationScenarioPayload;
};

export const startSimulation = async (
  payload: StartSimulationRequest,
  token: string,
): Promise<{
  sessionId: string;
  scenario: SimulationScenarioPayload;
}> => {
  const response = await fetch(`${apiBaseUrl}/api/start-simulation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Start simulation failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data as { sessionId: string; scenario: SimulationScenarioPayload };
};

export const sendSimulationDecision = async (
  payload: NextStepRequest,
  token: string,
): Promise<{
  outcome: unknown;
  scenario: SimulationScenarioPayload;
  reportPreview: SimulationReportPayload;
}> => {
  const response = await fetch(`${apiBaseUrl}/api/next-step`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Next step failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data as {
    outcome: unknown;
    scenario: SimulationScenarioPayload;
    reportPreview: SimulationReportPayload;
  };
};

export const fetchReport = async (
  sessionId: string,
  token: string,
): Promise<SimulationReportPayload> => {
  const response = await fetch(`${apiBaseUrl}/api/report/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Report request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data as SimulationReportPayload;
};

export const fetchMentors = async (token: string): Promise<MentorDirectoryEntry[]> => {
  const response = await fetch(`${apiBaseUrl}/api/mentor-support/mentors`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { data: MentorDirectoryEntry[] };
  return data.data;
};

export const fetchMentorInbox = async (token: string): Promise<MentorConversationSummary[]> => {
  const response = await fetch(`${apiBaseUrl}/api/mentor-support/inbox`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { data: MentorConversationSummary[] };
  return data.data;
};

export const fetchMentorConversation = async (
  token: string,
  params: { mentorId?: string; userId?: string },
): Promise<MentorConversationDetail> => {
  const searchParams = new URLSearchParams();
  if (params.mentorId) {
    searchParams.set("mentorId", params.mentorId);
  }
  if (params.userId) {
    searchParams.set("userId", params.userId);
  }

  const response = await fetch(
    `${apiBaseUrl}/api/mentor-support/conversation?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { data: MentorConversationDetail };
  return data.data;
};

export const sendMentorMessage = async (
  token: string,
  payload: { mentorId?: string; userId?: string; message: string },
) => {
  const response = await fetch(`${apiBaseUrl}/api/mentor-support/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = await response.json();
  return data.data as {
    _id: string;
    message: string;
    senderRole: "user" | "mentor";
    senderName: string;
    createdAt: string;
  };
};

export const fetchEvaluationState = async (token: string): Promise<EvaluationStatePayload> => {
  const response = await fetch(`${apiBaseUrl}/api/evaluations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { data: EvaluationStatePayload };
  return data.data;
};

export const syncEvaluationState = async (
  token: string,
  payload: EvaluationStatePayload,
): Promise<EvaluationStatePayload> => {
  const response = await fetch(`${apiBaseUrl}/api/evaluations/sync`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as { data: EvaluationStatePayload };
  return data.data;
};
