import { motion } from "framer-motion";
import { 
  Users, Lightbulb, DollarSign, Rocket, ShieldAlert, FileText, Presentation 
} from "lucide-react";

const phases = [
  { phase: "1", name: "Problem Validation", desc: "Interrogate the social problem, urgency, and root causes", icon: Lightbulb, color: "text-primary" },
  { phase: "2", name: "Community Discovery", desc: "Stress-test beneficiary needs, trust, and market adoption realities", icon: Users, color: "text-accent" },
  { phase: "3", name: "Solution Architecture", desc: "Test whether the solution works under real field constraints and limited resources", icon: Lightbulb, color: "text-primary" },
  { phase: "4", name: "Impact Model", desc: "Validate sustainability, affordability, and mission-aligned unit economics", icon: DollarSign, color: "text-accent" },
  { phase: "5", name: "Implementation Path", desc: "Design partnerships, stakeholder navigation, and go-to-market rollout strategy", icon: Rocket, color: "text-primary" },
  { phase: "6", name: "Risk and Resilience", desc: "Map policy, operational, and community trust risks", icon: ShieldAlert, color: "text-accent" },
  { phase: "7", name: "Impact Report", desc: "Generate synthesis, evidence, and market-readiness artifacts", icon: FileText, color: "text-primary" },
  { phase: "8", name: "Funder Panel", desc: "Defend launch readiness with grant, CSR, and impact capital perspectives", icon: Presentation, color: "text-accent" },
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
            Each phase tests whether a social startup can solve the real market-entry problems shown in this platform: management pressure, scarce resources, stakeholder complexity, and sustainable impact delivery.
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
