import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Clock,
  Award,
  FileText,
  Play,
  BarChart3,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { useEvaluation } from "@/context/EvaluationContext";
import { getDimensionLabel, type ReadinessDimension } from "@/lib/evaluation";

const Dashboard = () => {
  const { sessions, currentSession, latestCompletedSession, openSession } = useEvaluation();
  const navigate = useNavigate();

  const referenceSession = currentSession ?? latestCompletedSession;
  const completedCount = sessions.filter((session) => session.status === "completed").length;
  const inProgressCount = sessions.filter((session) => session.status === "in-progress").length;
  const scorecard = referenceSession?.scorecard;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
            Market readiness for <span className="text-gradient-primary">social startups</span>
          </h1>
          <p className="text-muted-foreground">
            Track evaluations, compare readiness signals, and see which ventures are closest to market entry.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {[
            {
              icon: BarChart3,
              label: "Best Readiness Score",
              value: `${latestCompletedSession?.overallScore ?? referenceSession?.overallScore ?? 0}/100`,
              color: "text-primary",
            },
            {
              icon: Clock,
              label: "In Progress",
              value: String(inProgressCount),
              color: "text-accent",
            },
            {
              icon: Target,
              label: "Completed Evaluations",
              value: String(completedCount),
              color: "text-primary",
            },
            {
              icon: Award,
              label: "Launch Recommendations",
              value: latestCompletedSession ? "Available" : "Pending",
              color: "text-accent",
            },
          ].map((stat, index) => (
            <div key={index} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="font-heading text-2xl font-bold text-foreground">{stat.value}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 glass rounded-xl p-6"
          >
            <h2 className="font-heading font-semibold text-lg text-foreground mb-6">Market readiness breakdown</h2>
            {referenceSession ? (
              <div className="space-y-5">
                {scorecard && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Impact", scorecard.impact],
                      ["Sustainability", scorecard.financialSustainability],
                      ["Ethics", scorecard.ethics],
                      ["Risk", scorecard.risk],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-secondary/50 p-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
                        <div className="mt-2 text-lg font-semibold text-primary">{value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {Object.entries(referenceSession.dimensionScores).map(([dimension, score]) => (
                  <div key={dimension}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground">
                        {getDimensionLabel(dimension as ReadinessDimension)}
                      </span>
                      <span className="text-sm font-semibold text-primary">{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No evaluation data yet. Start the first social startup review to see market-readiness scores here.
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-lg text-foreground">Startup evaluations</h2>
              <Button variant="hero" size="sm" asChild>
                <Link to="/simulation">
                  <Play className="w-3 h-3 mr-1" /> New Evaluation
                </Link>
              </Button>
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-lg bg-secondary/50 p-4 transition-colors hover:bg-secondary"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-foreground text-sm">{session.profile.startupName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {session.profile.sector} - {session.profile.geography}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-primary">{session.overallScore}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          session.status === "completed"
                            ? "bg-primary/15 text-primary"
                            : "bg-accent/15 text-accent"
                        }`}
                      >
                        {session.status === "completed" ? "Completed" : `Phase ${session.currentPhaseIndex + 1}`}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{session.readinessDecision}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          openSession(session.id);
                          navigate(session.status === "completed" ? "/results" : "/simulation");
                        }}
                      >
                        {session.status === "completed" ? "Open Report" : "Resume"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-secondary/40 p-6 text-sm text-muted-foreground">
                No sessions yet. Launch an evaluation to start scoring social startup market readiness.
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs" asChild>
                  <Link to="/simulation">
                    <Play className="w-3 h-3 mr-1" /> Continue Evaluation
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="text-xs" asChild>
                  <Link to="/results">
                    <FileText className="w-3 h-3 mr-1" /> View Market Report
                  </Link>
                </Button>
                <div className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  Jury mode ready for live demos
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
