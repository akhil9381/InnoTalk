import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import {
  applyPhaseResponse,
  createEmptySession,
  normalizeSession,
  rebuildSessionFromResponses,
  type EvaluationSession,
  type StartupProfile,
} from "@/lib/evaluation";

type EvaluationContextValue = {
  sessions: EvaluationSession[];
  currentSession: EvaluationSession | null;
  startSession: (profile: StartupProfile) => void;
  submitPhaseAnswer: (answer: string) => void;
  revisePreviousPhase: () => void;
  openSession: (sessionId: string) => void;
  resetCurrentSession: () => void;
  latestCompletedSession: EvaluationSession | null;
};

const STORAGE_KEY = "innotalk-evaluations";
const ACTIVE_SESSION_KEY = "innotalk-active-session";

const EvaluationContext = createContext<EvaluationContextValue | undefined>(undefined);

const readStoredSessions = () => {
  if (typeof window === "undefined") {
    return [] as EvaluationSession[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EvaluationSession[]).map((session) => normalizeSession(session)) : [];
  } catch {
    return [];
  }
};

export const EvaluationProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<EvaluationSession[]>(() => readStoredSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const stored = readStoredSessions();
    const rememberedSessionId = window.localStorage.getItem(ACTIVE_SESSION_KEY);

    if (rememberedSessionId && stored.some((session) => session.id === rememberedSessionId)) {
      return rememberedSessionId;
    }

    return stored.find((session) => session.status === "in-progress")?.id ?? null;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (currentSessionId) {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, currentSessionId);
    } else {
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [currentSessionId]);

  const currentSession = sessions.find((session) => session.id === currentSessionId) ?? null;
  const latestCompletedSession =
    [...sessions]
      .filter((session) => session.status === "completed")
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ?? null;

  const startSession = (profile: StartupProfile) => {
    const session = createEmptySession(profile);
    setSessions((prev) => [session, ...prev.filter((item) => item.status !== "in-progress")]);
    setCurrentSessionId(session.id);
  };

  const submitPhaseAnswer = (answer: string) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== currentSessionId) {
          return session;
        }
        return applyPhaseResponse(session, answer);
      }),
    );
  };

  const revisePreviousPhase = () => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== currentSessionId || session.responses.length === 0) {
          return session;
        }

        const trimmedResponses = session.responses.slice(0, -1).map((response) => ({
          answer: response.answer,
        }));
        const rebuilt = rebuildSessionFromResponses(session.profile, trimmedResponses);

        return {
          ...rebuilt,
          id: session.id,
          createdAt: session.createdAt,
        };
      }),
    );
  };

  const resetCurrentSession = () => {
    setSessions((prev) => prev.filter((session) => session.id !== currentSessionId));
    setCurrentSessionId(null);
  };

  const openSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <EvaluationContext.Provider
      value={{
        sessions,
        currentSession,
        startSession,
        submitPhaseAnswer,
        revisePreviousPhase,
        openSession,
        resetCurrentSession,
        latestCompletedSession,
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
};

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error("useEvaluation must be used within an EvaluationProvider");
  }
  return context;
};
