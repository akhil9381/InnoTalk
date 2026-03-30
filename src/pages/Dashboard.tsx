import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  TrendingUp, Clock, Award, FileText, Play, 
  BarChart3, Target, Shield, DollarSign, Users, Cpu, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const vvsData = [
  { label: "Market", score: 72, icon: TrendingUp },
  { label: "Financial", score: 58, icon: DollarSign },
  { label: "Technical", score: 85, icon: Cpu },
  { label: "Regulatory", score: 64, icon: Shield },
  { label: "Team", score: 70, icon: Users },
  { label: "Execution", score: 76, icon: Briefcase },
];

const sessions = [
  { name: "FinTech Payment App", date: "Mar 28, 2026", phase: "Phase 4", vvs: 68, status: "In Progress" },
  { name: "AgriTech Supply Chain", date: "Mar 15, 2026", phase: "Phase 7", vvs: 82, status: "Completed" },
  { name: "EdTech Tutor Platform", date: "Feb 20, 2026", phase: "Phase 3", vvs: 45, status: "Paused" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
            Welcome back, <span className="text-gradient-primary">Founder</span>
          </h1>
          <p className="text-muted-foreground">Your venture simulation dashboard</p>
        </motion.div>

        {/* Top stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {[
            { icon: BarChart3, label: "Overall VVS", value: "72/100", color: "text-primary" },
            { icon: Clock, label: "Total Sessions", value: "3", color: "text-accent" },
            { icon: Target, label: "Phases Completed", value: "14", color: "text-primary" },
            { icon: Award, label: "Certificates", value: "1", color: "text-accent" },
          ].map((s, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="font-heading text-2xl font-bold text-foreground">{s.value}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* VVS Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 glass rounded-xl p-6"
          >
            <h2 className="font-heading font-semibold text-lg text-foreground mb-6">VVS Breakdown</h2>
            <div className="space-y-5">
              {vvsData.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <d.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{d.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{d.score}%</span>
                  </div>
                  <Progress value={d.score} className="h-2" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-lg text-foreground">Sessions</h2>
              <Button variant="hero" size="sm">
                <Play className="w-3 h-3 mr-1" /> New Simulation
              </Button>
            </div>
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.date} · {s.phase}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">{s.vvs}</div>
                      <div className="text-xs text-muted-foreground">VVS</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      s.status === "Completed" ? "bg-primary/15 text-primary" :
                      s.status === "In Progress" ? "bg-accent/15 text-accent" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                {["Download PRD", "Export Pitch Deck", "View Certificate", "Share Report"].map((a, i) => (
                  <Button key={i} variant="outline" size="sm" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" /> {a}
                  </Button>
                ))}
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
