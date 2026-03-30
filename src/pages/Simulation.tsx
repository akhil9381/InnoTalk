import { useState } from "react";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Send, Bot, User, AlertTriangle, TrendingUp, 
  DollarSign, Users, Cpu, MessageSquare, Lightbulb
} from "lucide-react";

const agents = [
  { name: "VC Auditor", role: "Adversarial Challenger", icon: AlertTriangle, color: "text-destructive" },
  { name: "Finance Head", role: "Financial Scrutiny", icon: DollarSign, color: "text-accent" },
  { name: "Tech Lead", role: "Technical Feasibility", icon: Cpu, color: "text-primary" },
  { name: "Community Lead", role: "Market Viability", icon: Users, color: "text-primary" },
];

const phases = [
  { id: 0, name: "Market Confrontation", complete: true },
  { id: 0.5, name: "Bias Calibration", complete: true },
  { id: 1, name: "Problem Validation", complete: true },
  { id: 2, name: "Customer Discovery", active: true },
  { id: 3, name: "Solution Architecture" },
  { id: 4, name: "Business Model" },
  { id: 5, name: "Go-to-Market" },
  { id: 6, name: "Risk & Resilience" },
  { id: 7, name: "Smart Report" },
  { id: 7.5, name: "Investor Panel" },
];

const sampleMessages = [
  { role: "agent", agent: "VC Auditor", content: "You claim your target market is 'all small businesses.' That's not a market — that's a fantasy. Who specifically is your day-one customer, and why would they switch from their current solution?" },
  { role: "user", content: "We're targeting food delivery restaurants in Tier-2 cities in India that currently manage orders via WhatsApp and phone calls. They have no POS system and lose 15-20% of orders due to miscommunication." },
  { role: "agent", agent: "Finance Head", content: "Interesting niche. But 'Tier-2 food delivery restaurants' — what's your TAM? And more critically, what's the average revenue per restaurant? If it's under ₹2L/month, your unit economics might not support a SaaS model." },
  { role: "agent", agent: "Tech Lead", content: "Building a POS replacement means you need to handle offline mode, local printing, and payment integrations. What's your technical team's experience with embedded systems and payment gateways?" },
];

const Simulation = () => {
  const [input, setInput] = useState("");
  const [messages] = useState(sampleMessages);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex pt-16">
        {/* Sidebar - Phase Progress */}
        <div className="hidden lg:block w-72 border-r border-border p-6 overflow-y-auto">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-1">Phase Progress</h3>
          <p className="text-xs text-muted-foreground mb-6">Customer Discovery</p>
          <Progress value={35} className="h-1.5 mb-6" />

          <div className="space-y-1">
            {phases.map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  p.active ? "bg-primary/10 text-primary" :
                  p.complete ? "text-foreground" :
                  "text-muted-foreground"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  p.active ? "bg-primary animate-pulse-glow" :
                  p.complete ? "bg-primary/60" :
                  "bg-muted-foreground/30"
                }`} />
                <span className="text-xs font-mono text-muted-foreground w-6">{p.id}</span>
                <span className="text-xs">{p.name}</span>
              </div>
            ))}
          </div>

          {/* Agents */}
          <h3 className="font-heading font-semibold text-sm text-foreground mt-8 mb-4">Active Agents</h3>
          <div className="space-y-2">
            {agents.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <a.icon className={`w-4 h-4 ${a.color}`} />
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">{a.name}</div>
                  <div className="text-[10px] text-muted-foreground">{a.role}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Executive HUD */}
          <h3 className="font-heading font-semibold text-sm text-foreground mt-8 mb-4">Executive HUD</h3>
          <div className="space-y-3">
            {[
              { label: "Budget Health", value: 62, icon: DollarSign },
              { label: "Social Trust", value: 45, icon: Users },
              { label: "Failure Risk", value: 38, icon: AlertTriangle },
            ].map((h, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">{h.label}</span>
                  <span className="text-xs font-semibold text-foreground">{h.value}%</span>
                </div>
                <Progress value={h.value} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="border-b border-border px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-primary" />
              <div>
                <h2 className="font-heading font-semibold text-sm text-foreground">Phase 2: Customer Discovery</h2>
                <p className="text-xs text-muted-foreground">Target persona stress test & market sizing</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">VVS: </span>
              <span className="text-xs font-bold text-primary">68</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                >
                  {m.role === "agent" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-2xl ${
                    m.role === "user"
                      ? "bg-primary/10 border border-primary/20 rounded-2xl rounded-br-md px-5 py-3"
                      : "glass rounded-2xl rounded-bl-md px-5 py-3"
                  }`}>
                    {m.role === "agent" && (
                      <div className="text-xs font-semibold text-primary mb-1.5">{m.agent}</div>
                    )}
                    <p className="text-sm text-foreground leading-relaxed">{m.content}</p>
                  </div>
                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* AI thinking indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-accent animate-pulse-glow" />
              </div>
              <div className="glass rounded-2xl rounded-bl-md px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                  <span className="text-xs text-muted-foreground ml-2">Community Lead is analyzing your response...</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your response... (no multiple-choice — think deeply)"
                  className="w-full bg-secondary rounded-xl px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button variant="hero" size="icon" className="w-11 h-11 rounded-xl">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
