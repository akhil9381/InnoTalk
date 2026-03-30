import { motion } from "framer-motion";
import { 
  Search, AlertTriangle, Users, Lightbulb, DollarSign, 
  Rocket, ShieldAlert, FileText, Presentation 
} from "lucide-react";

const phases = [
  { phase: "0", name: "Market Confrontation", desc: "Live market grounding + VC Auditor challenge", icon: Search, color: "text-primary" },
  { phase: "0.5", name: "Bias Calibration", desc: "Founder mindset assessment + bias baseline", icon: AlertTriangle, color: "text-accent" },
  { phase: "1", name: "Problem Validation", desc: "Socratic interrogation of core problem", icon: Lightbulb, color: "text-primary" },
  { phase: "2", name: "Customer Discovery", desc: "Persona stress test & market sizing", icon: Users, color: "text-accent" },
  { phase: "3", name: "Solution Architecture", desc: "Technical feasibility & MVP scoping", icon: Lightbulb, color: "text-primary" },
  { phase: "4", name: "Business Model", desc: "Revenue model & unit economics", icon: DollarSign, color: "text-accent" },
  { phase: "5", name: "Go-to-Market", desc: "Distribution & launch strategy", icon: Rocket, color: "text-primary" },
  { phase: "6", name: "Risk & Resilience", desc: "Regulatory & operational risk mapping", icon: ShieldAlert, color: "text-accent" },
  { phase: "7", name: "Smart Report", desc: "Synthesis & artifact generation", icon: FileText, color: "text-primary" },
  { phase: "7.5", name: "Investor Panel", desc: "Live AI investor Q&A simulation", icon: Presentation, color: "text-accent" },
];

const PhasesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
            The <span className="text-gradient-primary">8-Phase</span> Gauntlet
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Each phase escalates in adversarial intensity. No shortcuts. No hand-holding.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {phases.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass glass-hover rounded-xl p-5 group cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono text-muted-foreground">Phase {p.phase}</span>
              </div>
              <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mb-3`}>
                <p.icon className={`w-4 h-4 ${p.color}`} />
              </div>
              <h3 className="font-heading font-semibold text-sm text-foreground mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhasesSection;
