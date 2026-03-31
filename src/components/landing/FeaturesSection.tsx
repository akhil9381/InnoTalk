import { motion } from "framer-motion";
import { 
  Brain, DollarSign, Building2, LineChart
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Interactive management simulations",
    desc: "Run founder decision scenarios that mimic real social enterprise tradeoffs around pilots, delivery, hiring, and launch timing.",
  },
  {
    icon: DollarSign,
    title: "Resource allocation modules",
    desc: "Evaluate how a startup balances limited capital across team, technology, outreach, operations, and impact priorities.",
  },
  {
    icon: Building2,
    title: "Stakeholder navigation scenarios",
    desc: "Pressure-test how the venture works with government bodies, NGOs, funders, communities, and implementation partners.",
  },
  {
    icon: LineChart,
    title: "Impact sustainability dashboard",
    desc: "Show how social outcomes, adoption, execution, and financial viability move together before market entry.",
  },
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
            Solve The <span className="text-gradient-accent">Real Readiness Problems</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The platform is designed to close the four practical gaps that stop social startups from reaching the market responsibly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
