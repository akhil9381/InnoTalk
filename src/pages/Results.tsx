import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  Download,
  Share2,
  FileText,
  Presentation,
  Shield,
  Users,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Brain,
  QrCode,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Cpu,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEvaluation } from "@/context/EvaluationContext";
import { getDimensionLabel, normalizeSession, type ReadinessDimension } from "@/lib/evaluation";
import { buildShareSummary, buildVerificationCode, downloadArtifact } from "@/lib/reporting";
import { toast } from "sonner";

const dimensionIcons: Record<ReadinessDimension, typeof TrendingUp> = {
  needClarity: TrendingUp,
  communityTrust: Users,
  innovationFit: Cpu,
  sustainability: DollarSign,
  goToMarket: Briefcase,
  governance: Shield,
};

const Results = () => {
  const { latestCompletedSession, currentSession } = useEvaluation();
  const session =
    (currentSession?.status === "completed" ? normalizeSession(currentSession) : null) ??
    (latestCompletedSession ? normalizeSession(latestCompletedSession) : null);

  const artifacts = [
    { name: "Market Readiness Brief", type: "TXT", icon: FileText, key: "brief" },
    { name: "Stakeholder Navigation Deck", type: "TXT", icon: Presentation, key: "deck" },
    { name: "Resource Allocation Plan", type: "TXT", icon: FileText, key: "resource-plan" },
    { name: "Impact Sustainability Dashboard", type: "TXT", icon: DollarSign, key: "dashboard" },
  ];

  const verificationCode = buildVerificationCode(session);

  const handleCertificateDownload = () => {
    downloadArtifact(session, "certificate");
    toast.success("Certificate downloaded");
  };

  const handleShare = async () => {
    const shareText = buildShareSummary(session);
    const shareUrl = `${window.location.origin}/results`;

    if (navigator.share) {
      await navigator.share({
        title: `${session.profile.startupName} market readiness report`,
        text: shareText,
        url: shareUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer",
    );
    toast.success("Report summary copied and LinkedIn share opened");
  };

  const handleVerify = async () => {
    await navigator.clipboard.writeText(verificationCode);
    toast.success(`Verification code copied: ${verificationCode}`);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-16">
          <div className="mx-auto max-w-3xl rounded-2xl bg-secondary/40 p-8 text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground">No completed report yet</h1>
            <p className="mt-3 text-muted-foreground">
              Complete a social startup evaluation to generate a full market-readiness report.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="hero" asChild>
                <Link to="/simulation">Start Evaluation</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">Market Readiness Evaluation Complete</span>
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4 leading-[1.08]">
            Your <span className="inline-block text-[1.03em] font-bold leading-none text-gradient-primary">Market Report</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {session.profile.startupName} - {session.profile.sector} in {session.profile.geography}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 mb-8 max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeDasharray={`${session.overallScore * 3.27} ${327 - session.overallScore * 3.27}`}
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-4xl font-bold text-foreground">{session.overallScore}</span>
                <span className="text-xs text-muted-foreground">Readiness Score</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                Social Startup Market Readiness Score
              </h2>
              <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {session.readinessDecision}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="hero" size="sm" onClick={handleCertificateDownload}>
                  <Award className="w-3 h-3 mr-1" /> Get Market Certificate
                </Button>
                <Button variant="hero-outline" size="sm" onClick={() => void handleShare()}>
                  <Share2 className="w-3 h-3 mr-1" /> Share on LinkedIn
                </Button>
                <Button variant="outline" size="sm" onClick={() => void handleVerify()}>
                  <QrCode className="w-3 h-3 mr-1" /> Verify Report
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Verification code: {verificationCode}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="glass rounded-2xl p-8 mb-8 max-w-6xl mx-auto border border-primary/20 shadow-[0_20px_60px_hsl(var(--primary)/0.12)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Guidance and Roadmap</h2>
              <p className="text-sm text-muted-foreground">
                Follow this plan to close the most important gaps before the next market step.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {session.roadmap.map((item, index) => (
              <div
                key={`${item.timeline}-${item.title}`}
                className="relative overflow-hidden rounded-2xl border border-border bg-secondary/40 p-5"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-primary" />
                <div className="ml-3">
                  <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {item.timeline}
                  </div>
                  <div className="mt-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <h3 className="min-w-0 truncate text-base font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.focus}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass rounded-xl p-6"
          >
            <h2 className="font-heading font-semibold text-lg text-foreground mb-6">Score Breakdown</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                ["Impact", session.scorecard.impact],
                ["Financial Sustainability", session.scorecard.financialSustainability],
                ["Ethics", session.scorecard.ethics],
                ["Risk Index", session.scorecard.risk],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-secondary/50 p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                  <div className="mt-2 text-xl font-semibold text-primary">{value}</div>
                </div>
              ))}
            </div>
            <div className="space-y-5">
              {Object.entries(session.dimensionScores).map(([dimension, score]) => {
                const Icon = dimensionIcons[dimension as ReadinessDimension];
                return (
                  <div key={dimension}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {getDimensionLabel(dimension as ReadinessDimension)}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          score >= 80 ? "text-primary" : score >= 65 ? "text-accent" : "text-destructive"
                        }`}
                      >
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2 mb-1.5" />
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-accent" />
                <h2 className="font-heading font-semibold text-foreground">Critical Gaps</h2>
              </div>
              <div className="space-y-3">
                {session.blindspots.map((blindspot, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <p className="min-w-0 text-xs leading-relaxed text-muted-foreground">{blindspot}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <h2 className="font-heading font-semibold text-foreground">Recommended Next Steps</h2>
              </div>
              <div className="space-y-3">
                {session.recommendedActions.map((item, index) => (
                  <p key={index} className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-secondary/50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-primary">AI mentor summary</div>
                <p className="mt-2 text-xs text-muted-foreground">{session.mentorTip}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.37 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <RotateCcw className="w-4 h-4 text-accent" />
                <h2 className="font-heading font-semibold text-foreground">Failure Replay</h2>
              </div>
              <div className="space-y-3">
                {session.failureReplay.length > 0 ? session.failureReplay.map((item) => (
                  <div key={`${item.phaseId}-${item.issue}`} className="rounded-lg bg-secondary/50 p-3">
                    <div className="text-xs font-medium text-foreground">Phase {item.phaseId}: {item.phaseName}</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.issue}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-foreground">{item.betterAlternative}</p>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground">No major failure points were identified in this run.</p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-4 h-4 text-primary" />
                <h2 className="font-heading font-semibold text-foreground">Generated Artifacts</h2>
              </div>
              <div className="space-y-2">
                {artifacts.map((artifact, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      downloadArtifact(session, artifact.key);
                      toast.success(`${artifact.name} downloaded`);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <artifact.icon className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-xs font-medium text-foreground">{artifact.name}</div>
                        <div className="text-[10px] text-muted-foreground">{artifact.type}</div>
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Results;
