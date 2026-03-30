import { motion } from "framer-motion";
import { 
  Brain, Scale, TrendingDown, Swords, Users2, 
  GraduationCap, Globe, GitBranch, Presentation, 
  ScanEye, Link2, LineChart 
} from "lucide-react";

const features = [
  { icon: Brain, title: "AI Co-Founder Engine", desc: "Personality-driven matching based on your simulation behavior" },
  { icon: Scale, title: "Regulatory Intelligence", desc: "Real-time compliance radar for your industry and geography" },
  { icon: TrendingDown, title: "Financial Stress Tester", desc: "Monte Carlo simulations and break-even analysis" },
  { icon: Swords, title: "Devil's Advocate Mode", desc: "Fourth AI agent builds the strongest case against your venture" },
  { icon: Users2, title: "Cohort Benchmarking", desc: "Compare your performance against founders in your domain" },
  { icon: GraduationCap, title: "Mentor-in-the-Loop", desc: "Connect sessions to real human mentors for annotations" },
  { icon: Globe, title: "Multilingual Mode", desc: "Simulations in Telugu, Hindi, Tamil, and more" },
  { icon: GitBranch, title: "Branch Explorer", desc: "'What if?' decision tree replay and alternative paths" },
  { icon: Presentation, title: "Investor Panel", desc: "Timed AI investor Q&A with 3 distinct archetypes" },
  { icon: ScanEye, title: "Anti-Bias Engine", desc: "Detects confirmation bias, overconfidence, and more" },
  { icon: Link2, title: "Ecosystem Hub", desc: "Connect to T-Works, T-Hub, NASSCOM, and Startup India" },
  { icon: LineChart, title: "Journey Tracker", desc: "Track your founder evolution across multiple sessions" },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
            Beyond <span className="text-gradient-accent">Simulation</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            12 extended capabilities designed to take you from idea to investor-ready.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="glass glass-hover rounded-xl p-6 group cursor-pointer transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
