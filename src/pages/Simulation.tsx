import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEvaluation } from "@/context/EvaluationContext";
import {
  evaluationPhases,
  getDimensionLabel,
  type ReadinessDimension,
  type StartupProfile,
} from "@/lib/evaluation";
import { fetchEvaluationQuestion, type EvaluationQuestionResponse } from "@/lib/api";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bot,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  MessageSquare,
  Scale,
  RotateCcw,
  Send,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const initialProfile: StartupProfile = {
  startupName: "",
  sector: "",
  geography: "",
  mission: "",
  beneficiaries: "",
  solutionApproach: "",
  model: "",
  stage: "",
  difficulty: "realistic",
  evaluationMode: "reality-engine",
  juryMode: false,
};

const Simulation = () => {
  const {
    currentSession,
    startSession,
    submitPhaseAnswer,
    revisePreviousPhase,
    resetCurrentSession,
  } = useEvaluation();
  const [profile, setProfile] = useState<StartupProfile>(initialProfile);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [otherAnswer, setOtherAnswer] = useState("");
  const [generatedQuestion, setGeneratedQuestion] = useState<EvaluationQuestionResponse | null>(null);
  const [questionStatus, setQuestionStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const activePhase =
    currentSession && currentSession.status !== "completed"
      ? evaluationPhases[currentSession.currentPhaseIndex]
      : null;

  const completedPhases = currentSession?.responses.length ?? 0;
  const progress = Math.round((completedPhases / evaluationPhases.length) * 100);

  const canStartSession = [
    profile.startupName,
    profile.sector,
    profile.geography,
    profile.mission,
    profile.beneficiaries,
    profile.solutionApproach,
    profile.model,
    profile.stage,
    profile.difficulty,
    profile.evaluationMode,
  ].every((value) => value.trim().length > 0);
  const latestResponse = currentSession?.responses[currentSession.responses.length - 1] ?? null;
  const scorecard = currentSession?.scorecard;

  const scorecards = scorecard
    ? [
        {
          label: "Impact Score",
          value: scorecard.impact,
          icon: TrendingUp,
          tone: "text-primary",
        },
        {
          label: "Financial Sustainability",
          value: scorecard.financialSustainability,
          icon: Target,
          tone: "text-accent",
        },
        {
          label: "Ethics Score",
          value: scorecard.ethics,
          icon: Scale,
          tone: "text-primary",
        },
        {
          label: "Risk Index",
          value: scorecard.risk,
          icon: ShieldAlert,
          tone: "text-accent",
        },
      ]
    : [];

  useEffect(() => {
    let cancelled = false;

    const loadQuestion = async () => {
      if (!currentSession || !activePhase || currentSession.status === "completed") {
        setGeneratedQuestion(null);
        setQuestionStatus("idle");
        return;
      }

      setQuestionStatus("loading");

      try {
        const response = await fetchEvaluationQuestion({
          phase: {
            id: activePhase.id,
            name: activePhase.name,
            prompt: activePhase.prompt,
            guidance: activePhase.guidance,
            dimensions: activePhase.dimensions,
          },
          startupProfile: currentSession.profile,
          previousResponses: currentSession.responses.map((item) => ({
            phaseId: item.phaseId,
            phaseName: item.phaseName,
            answer: item.answer,
            score: item.score,
            feedback: item.feedback,
          })),
        });

        if (!cancelled) {
          setGeneratedQuestion(response);
          setQuestionStatus("ready");
          setSelectedOptionId(null);
          setOtherAnswer("");
        }
      } catch (error) {
        if (!cancelled) {
          setGeneratedQuestion({
            stakeholder: activePhase.agentName,
            scenario: `${activePhase.agentName} is testing your readiness for the current phase.`,
            question: activePhase.prompt,
            guidance: activePhase.guidance,
            rationale: "Default question used because the Gemini request was unavailable.",
            options: [],
            allowOther: true,
            source: "fallback",
          });
          setQuestionStatus("error");
          setSelectedOptionId(null);
          setOtherAnswer("");
        }
      }
    };

    void loadQuestion();

    return () => {
      cancelled = true;
    };
  }, [activePhase, currentSession]);

  const handleProfileChange = (field: keyof StartupProfile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: field === "juryMode" ? value === "true" : value,
    }));
  };

  const handleStartSession = () => {
    if (!canStartSession) {
      return;
    }
    startSession(profile);
    setSelectedOptionId(null);
    setOtherAnswer("");
  };

  const selectedOption =
    generatedQuestion?.options.find((option) => option.id === selectedOptionId) ?? null;
  const usingOther = selectedOptionId === "other";
  const canSubmitAnswer =
    selectedOptionId !== null && (!usingOther || otherAnswer.trim().length >= 20);

  const buildAnswerPayload = () => {
    if (!activePhase || !generatedQuestion || !selectedOptionId) {
      return "";
    }

    if (usingOther) {
      return [
        `Stakeholder: ${generatedQuestion.stakeholder}`,
        `Scenario: ${generatedQuestion.scenario}`,
        `Question: ${generatedQuestion.question}`,
        `Chosen response: Other`,
        `Founder answer: ${otherAnswer.trim()}`,
      ].join("\n");
    }

    return [
      `Stakeholder: ${generatedQuestion.stakeholder}`,
      `Scenario: ${generatedQuestion.scenario}`,
      `Question: ${generatedQuestion.question}`,
      `Chosen option: ${selectedOption?.label ?? ""}`,
      `Expected consequence: ${selectedOption?.consequence ?? ""}`,
    ].join("\n");
  };

  const handleSubmitAnswer = () => {
    if (!activePhase || !canSubmitAnswer) {
      return;
    }
    submitPhaseAnswer(buildAnswerPayload());
    setSelectedOptionId(null);
    setOtherAnswer("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16">
        {!currentSession && (
          <div className="container mx-auto px-6 py-10">
            <div className="max-w-5xl mx-auto">
              <div className="glass rounded-2xl p-8">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Social Startup Market Readiness Evaluation</span>
                  </div>
                  <h1 className="mt-5 font-heading text-3xl font-bold text-foreground">
                    Start a market-readiness review for a social innovation
                  </h1>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Startup name</span>
                    <input
                      value={profile.startupName}
                      onChange={(event) => handleProfileChange("startupName", event.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Example: Rural Health Access Network"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Geography</span>
                    <input
                      value={profile.geography}
                      onChange={(event) => handleProfileChange("geography", event.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Primary market or region"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Current stage</span>
                    <input
                      value={profile.stage}
                      onChange={(event) => handleProfileChange("stage", event.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Idea, pilot, early revenue, expansion..."
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Domain</span>
                    <select
                      value={profile.sector}
                      onChange={(event) => handleProfileChange("sector", event.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Select domain</option>
                      <option value="Education">Education</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Environment">Environment</option>
                      <option value="Livelihoods">Livelihoods</option>
                      <option value="Civic Tech">Civic Tech</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Difficulty</span>
                    <select
                      value={profile.difficulty}
                      onChange={(event) =>
                        handleProfileChange(
                          "difficulty",
                          event.target.value as StartupProfile["difficulty"],
                        )
                      }
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="easy">Easy</option>
                      <option value="realistic">Realistic</option>
                      <option value="hardcore">Hardcore</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-4">
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Mission</span>
                    <textarea
                      value={profile.mission}
                      onChange={(event) => handleProfileChange("mission", event.target.value)}
                      className="min-h-28 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="What urgent social outcome is this innovation trying to create, and why does it matter in the market now?"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Primary beneficiaries or customers</span>
                    <textarea
                      value={profile.beneficiaries}
                      onChange={(event) => handleProfileChange("beneficiaries", event.target.value)}
                      className="min-h-24 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Who benefits, who pays, and who influences market adoption?"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Solution approach</span>
                    <textarea
                      value={profile.solutionApproach}
                      onChange={(event) => handleProfileChange("solutionApproach", event.target.value)}
                      className="min-h-24 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Describe the core innovation or intervention and how it solves the social problem in a way that can be taken to market..."
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Operating model</span>
                    <textarea
                      value={profile.model}
                      onChange={(event) => handleProfileChange("model", event.target.value)}
                      className="min-h-24 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="How does the startup deliver value, reach the market, and stay sustainable?"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Mode</span>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        {
                          id: "reality-engine",
                          title: "AI-Powered Reality Engine",
                          copy: "Stakeholder simulation with disruptions, tradeoffs, and consequence timelines.",
                        },
                        {
                          id: "pitch-evaluator",
                          title: "Pitch Evaluator Mode",
                          copy: "Idea-focused review for feasibility, risks, impact, and partner readiness.",
                        },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() =>
                            handleProfileChange(
                              "evaluationMode",
                              mode.id as StartupProfile["evaluationMode"],
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            profile.evaluationMode === mode.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary hover:bg-secondary/80"
                          }`}
                        >
                          <div className="text-sm font-medium text-foreground">{mode.title}</div>
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-foreground">Jury mode</span>
                    <button
                      type="button"
                      onClick={() => handleProfileChange("juryMode", String(!profile.juryMode))}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                        profile.juryMode
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      <div className="text-sm font-medium text-foreground">
                        {profile.juryMode ? "Enabled" : "Disabled"}
                      </div>
                    </button>
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="hero" size="lg" onClick={handleStartSession} disabled={!canStartSession}>
                    {profile.evaluationMode === "pitch-evaluator" ? "Evaluate Pitch" : "Start Evaluation"} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/dashboard">View Dashboard</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentSession && (
          <div className="container mx-auto px-6 py-8">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Active evaluation</p>
                    <h2 className="mt-2 font-heading text-xl font-semibold text-foreground">
                      {currentSession.profile.startupName}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currentSession.profile.sector} in {currentSession.profile.geography}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {currentSession.profile.evaluationMode === "pitch-evaluator" ? "Pitch Evaluator Mode" : "AI-Powered Reality Engine"} · {currentSession.profile.difficulty} difficulty
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetCurrentSession}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{completedPhases}/{evaluationPhases.length}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="mt-6 space-y-2">
                  {evaluationPhases.map((phase, index) => {
                    const isDone = index < completedPhases;
                    const isActive = currentSession.status !== "completed" && index === currentSession.currentPhaseIndex;
                    return (
                      <div
                        key={phase.id}
                        className={`rounded-xl border px-3 py-3 text-sm ${
                          isActive
                            ? "border-primary/40 bg-primary/10"
                            : isDone
                              ? "border-border bg-secondary/70"
                              : "border-border/60 bg-secondary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-foreground">Phase {phase.id}</span>
                          {isDone && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{phase.name}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-xl bg-secondary/60 p-4">
                  <h3 className="text-sm font-medium text-foreground">Current score</h3>
                  <div className="mt-2 font-heading text-3xl font-bold text-primary">
                    {currentSession.overallScore}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{currentSession.readinessDecision}</p>
                </div>

                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Live score sidebar</h3>
                  {scorecards.map((item) => (
                    <div key={item.label} className="rounded-xl bg-secondary/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <item.icon className={`h-4 w-4 ${item.tone}`} />
                          <span className="text-sm text-foreground">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-primary">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {currentSession.activeDisruption && (
                    <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-accent" />
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-accent">Crisis popup alert</p>
                          <h3 className="mt-2 text-sm font-semibold text-foreground">
                            {currentSession.activeDisruption.title}
                          </h3>
                          <p className="mt-2 text-xs text-foreground">
                            {currentSession.activeDisruption.impact}
                          </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentSession.profile.juryMode && (
                  <div className="mt-6 rounded-xl border border-border bg-background/40 p-4">
                    <h3 className="text-sm font-medium text-foreground">Jury mode</h3>
                    <div className="mt-3 grid gap-3">
                      {[
                        "Founder seat",
                        "Investor seat",
                        "Government seat",
                        "Community seat",
                      ].map((title) => (
                        <div key={title} className="rounded-lg bg-secondary/60 p-3">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl p-6">
                {currentSession.status === "completed" ? (
                  <div className="mx-auto max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Evaluation complete</span>
                    </div>
                    <h1 className="mt-5 font-heading text-3xl font-bold text-foreground">
                      {currentSession.readinessDecision}
                    </h1>
                    <p className="mt-3 text-muted-foreground">{currentSession.readinessSummary}</p>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                      <div className="rounded-2xl bg-secondary/60 p-5">
                        <h2 className="font-heading text-lg font-semibold text-foreground">Top strengths</h2>
                        <div className="mt-4 space-y-3">
                          {currentSession.strengths.map((item, index) => (
                            <div key={index} className="flex gap-3 text-sm text-muted-foreground">
                              <Target className="mt-0.5 h-4 w-4 text-primary" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-secondary/60 p-5">
                        <h2 className="font-heading text-lg font-semibold text-foreground">Critical gaps</h2>
                        <div className="mt-4 space-y-3">
                          {currentSession.blindspots.map((item, index) => (
                            <div key={index} className="flex gap-3 text-sm text-muted-foreground">
                              <AlertTriangle className="mt-0.5 h-4 w-4 text-accent" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                      <div className="rounded-2xl bg-secondary/60 p-5">
                        <h2 className="font-heading text-lg font-semibold text-foreground">Gamification</h2>
                        <p className="mt-3 text-sm text-muted-foreground">
                          Level: <span className="font-medium text-foreground">{currentSession.level}</span>
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {currentSession.badges.length > 0 ? currentSession.badges.map((badge) => (
                            <div key={badge} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                              {badge}
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground">Badges unlock when the venture shows stronger tradeoff discipline.</p>
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-secondary/60 p-5">
                        <h2 className="font-heading text-lg font-semibold text-foreground">Failure replay system</h2>
                        <div className="mt-4 space-y-3">
                          {currentSession.failureReplay.length > 0 ? currentSession.failureReplay.map((item) => (
                            <div key={`${item.phaseId}-${item.issue}`} className="rounded-xl bg-background/60 p-3">
                              <div className="text-sm font-medium text-foreground">Phase {item.phaseId}: {item.phaseName}</div>
                              <p className="mt-1 text-xs text-muted-foreground">{item.issue}</p>
                              <p className="mt-2 text-xs text-foreground">{item.betterAlternative}</p>
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground">No major failure points were flagged in this run.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 rounded-2xl bg-secondary/60 p-5">
                      <h2 className="font-heading text-lg font-semibold text-foreground">Dimension scores</h2>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {Object.entries(currentSession.dimensionScores).map(([dimension, score]) => (
                          <div key={dimension}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-foreground">{getDimensionLabel(dimension as ReadinessDimension)}</span>
                              <span className="font-semibold text-primary">{score}%</span>
                            </div>
                            <Progress value={score} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      {currentSession.failureReplay.length > 0 && (
                        <Button variant="outline" onClick={revisePreviousPhase}>
                          Replay Weak Point <RotateCcw className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="hero" asChild>
                        <Link to="/results">
                          View Full Report <FileText className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/dashboard">Back to Dashboard</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl">
                    {activePhase && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <MessageSquare className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-primary">
                              Phase {activePhase.id}
                            </p>
                            <h1 className="font-heading text-2xl font-bold text-foreground">
                              {currentSession.profile.evaluationMode === "pitch-evaluator" ? `${activePhase.name} Pitch Review` : activePhase.name}
                            </h1>
                          </div>
                        </div>

                        <div className="mt-6 rounded-2xl bg-secondary/60 p-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                              <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-primary">
                                {generatedQuestion?.stakeholder ?? activePhase.agentName}
                              </div>
                              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                {generatedQuestion?.scenario}
                              </p>
                              <p className="mt-3 text-sm leading-relaxed text-foreground">
                                {generatedQuestion?.question ?? activePhase.prompt}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                          {[
                            {
                              title: generatedQuestion?.stakeholder ?? activePhase.agentName,
                              icon: Users,
                            },
                            {
                              title: "Government lens",
                              icon: ShieldAlert,
                            },
                            {
                              title: "Community lens",
                              icon: BadgeCheck,
                            },
                          ].map((persona) => (
                            <div key={persona.title} className="rounded-2xl border border-border bg-background/40 p-4">
                              <div className="flex items-center gap-2">
                                <persona.icon className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">{persona.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 rounded-2xl border border-border bg-background/40 p-4">
                          <div className="flex items-start gap-3">
                            <Lightbulb className="mt-0.5 h-4 w-4 text-accent" />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {generatedQuestion?.guidance ?? activePhase.guidance}
                              </p>
                              {questionStatus !== "idle" && (
                                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-primary/80">
                                  {questionStatus === "loading"
                                    ? "Generating question with Gemini"
                                    : generatedQuestion?.source === "gemini"
                                      ? "Question generated with Gemini"
                                      : "Using fallback question"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {latestResponse && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 rounded-2xl bg-primary/8 p-5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <h2 className="font-heading text-lg font-semibold text-foreground">
                                Latest evaluator feedback
                              </h2>
                              <span className="text-sm font-semibold text-primary">
                                {latestResponse.score}/100
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">{latestResponse.feedback}</p>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <div>
                                <h3 className="text-sm font-medium text-foreground">Strengths</h3>
                                <div className="mt-2 space-y-2">
                                  {latestResponse.strengths.map((item, index) => (
                                    <p key={index} className="text-sm text-muted-foreground">{item}</p>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-foreground">Gaps to close</h3>
                                <div className="mt-2 space-y-2">
                                  {latestResponse.blindspots.map((item, index) => (
                                    <p key={index} className="text-sm text-muted-foreground">{item}</p>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-primary/20 bg-background/50 p-4">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-accent" />
                                <h3 className="text-sm font-medium text-foreground">Personal AI mentor</h3>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">{latestResponse.mentorTip}</p>
                              <p className="mt-3 text-sm text-foreground">{latestResponse.stakeholderReaction}</p>
                              {latestResponse.disruption && (
                                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-accent">
                                  Reality engine event: {latestResponse.disruption}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}

                        <div className="mt-6">
                          <div className="space-y-3">
                            {generatedQuestion?.options.map((option) => {
                              const isSelected = selectedOptionId === option.id;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => setSelectedOptionId(option.id)}
                                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                                    isSelected
                                      ? "border-primary bg-primary/10"
                                      : "border-border bg-secondary hover:bg-secondary/80"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                                    {isSelected && (
                                      <span className="text-xs font-semibold text-primary">{option.scoreHint}/100</span>
                                    )}
                                  </div>
                                  <p className="mt-2 text-xs text-muted-foreground">{option.consequence}</p>
                                </button>
                              );
                            })}

                            {(generatedQuestion?.allowOther ?? true) && (
                              <button
                                type="button"
                                onClick={() => setSelectedOptionId("other")}
                                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                                  usingOther
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-secondary hover:bg-secondary/80"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-sm font-medium text-foreground">Other</span>
                                  <span className="text-xs text-muted-foreground">Give your own response</span>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Use this if none of the options reflect how you would respond in the market.
                                </p>
                              </button>
                            )}
                          </div>

                          {usingOther && (
                            <textarea
                              value={otherAnswer}
                              onChange={(event) => setOtherAnswer(event.target.value)}
                              placeholder={activePhase.placeholder}
                              className="mt-4 min-h-40 w-full rounded-2xl border border-border bg-secondary px-5 py-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          )}

                          {selectedOption && (
                            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-foreground">If you choose this</h3>
                                <span className="text-sm font-semibold text-primary">{selectedOption.scoreHint}/100</span>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">{selectedOption.consequence}</p>
                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div className="rounded-xl bg-background/60 p-3">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    Today
                                  </div>
                                  <p className="mt-2 text-sm text-foreground">{selectedOption.consequence}</p>
                                </div>
                                <div className="rounded-xl bg-background/60 p-3">
                                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-accent">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    3 months later
                                  </div>
                                  <p className="mt-2 text-sm text-foreground">
                                    This choice will affect trust, sustainability, and policy readiness in the next round.
                                  </p>
                                </div>
                              </div>
                              <p className="mt-3 text-xs text-muted-foreground">
                                You can still go back and choose another option before submitting.
                              </p>
                            </div>
                          )}

                          {usingOther && otherAnswer.trim().length > 0 && (
                            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                              <h3 className="text-sm font-semibold text-foreground">Custom response path</h3>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Your custom answer will be scored from its evidence, stakeholder awareness, and market realism.
                              </p>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-4">
                            <p className="text-xs text-muted-foreground">
                              Choose a response path, review the likely outcome, and submit when you are ready. The next scenario will adapt from this choice.
                            </p>
                            <div className="flex gap-3">
                              {currentSession.responses.length > 0 && (
                                <Button variant="outline" onClick={revisePreviousPhase}>
                                  Go Back One Phase
                                </Button>
                              )}
                              <Button
                                variant="hero"
                                onClick={handleSubmitAnswer}
                                disabled={!canSubmitAnswer}
                              >
                                Submit phase answer <Send className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Simulation;
