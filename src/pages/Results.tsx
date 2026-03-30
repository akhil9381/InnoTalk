import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award, Download, Share2, FileText, Presentation,
  TrendingUp, DollarSign, Cpu, Shield, Users, Briefcase,
  CheckCircle2, AlertCircle, Brain, QrCode
} from "lucide-react";

const vvsBreakdown = [
  { label: "Market", score: 82, icon: TrendingUp, feedback: "Strong TAM analysis. Need sharper ICP definition." },
  { label: "Financial", score: 68, icon: DollarSign, feedback: "Unit economics are thin. Revisit CAC assumptions." },
  { label: "Technical", score: 85, icon: Cpu, feedback: "Solid MVP scope. Offline-first approach is smart." },
  { label: "Regulatory", score: 72, icon: Shield, feedback: "FSSAI compliance addressed. Missing GST implications." },
  { label: "Team", score: 65, icon: Users, feedback: "Needs co-founder with financial domain expertise." },
  { label: "Execution", score: 78, icon: Briefcase, feedback: "Go-to-market plan is actionable. Timeline is aggressive." },
];

const blindspots = [
  "Underestimated customer acquisition cost in Tier-2 cities",
  "No contingency plan for regulatory changes in food delivery",
  "Overreliance on single revenue stream (subscription)",
  "Competitor analysis missed 2 key regional players",
];

const artifacts = [
  { name: "Product Requirements Document", type: "PRD", icon: FileText },
  { name: "Investor Pitch Deck", type: "PPTX", icon: Presentation },
  { name: "PRISM Grant Application", type: "PDF", icon: FileText },
  { name: "Financial Model", type: "XLSX", icon: DollarSign },
];

const Results = () => {
  const overallVVS = 75;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">Simulation Complete</span>
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4">
            Your <span className="text-gradient-primary">Smart Report</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            FinTech Payment App — Tier-2 Restaurant POS Platform
          </p>
        </motion.div>

        {/* VVS Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 mb-8 max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score Circle */}
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeDasharray={`${overallVVS * 3.27} ${327 - overallVVS * 3.27}`}
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-4xl font-bold text-foreground">{overallVVS}</span>
                <span className="text-xs text-muted-foreground">VVS Score</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">Verified Venture Score</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your idea shows strong technical foundations but needs financial model refinement.
                You're in the <span className="text-primary font-semibold">top 30%</span> of FinTech simulation cohort.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero" size="sm">
                  <Award className="w-3 h-3 mr-1" /> Get Certificate
                </Button>
                <Button variant="hero-outline" size="sm">
                  <Share2 className="w-3 h-3 mr-1" /> Share on LinkedIn
                </Button>
                <Button variant="outline" size="sm">
                  <QrCode className="w-3 h-3 mr-1" /> QR Verify
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* VVS Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass rounded-xl p-6"
          >
            <h2 className="font-heading font-semibold text-lg text-foreground mb-6">Score Breakdown</h2>
            <div className="space-y-5">
              {vvsBreakdown.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <d.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{d.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${d.score >= 80 ? "text-primary" : d.score >= 65 ? "text-accent" : "text-destructive"}`}>
                      {d.score}%
                    </span>
                  </div>
                  <Progress value={d.score} className="h-2 mb-1.5" />
                  <p className="text-xs text-muted-foreground">{d.feedback}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Blindspots & Artifacts */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-accent" />
                <h2 className="font-heading font-semibold text-foreground">Cognitive Blindspots</h2>
              </div>
              <div className="space-y-3">
                {blindspots.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{b}</p>
                  </div>
                ))}
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
                {artifacts.map((a, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <a.icon className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-xs font-medium text-foreground">{a.name}</div>
                        <div className="text-[10px] text-muted-foreground">{a.type}</div>
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
