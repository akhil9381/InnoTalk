import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">
            Ready to <span className="text-gradient-primary">Stress-Test</span> Your Idea?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join founders who've eliminated blindspots, impressed investors, and built with conviction — not hope.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="text-base px-10">
              Start Free Simulation <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-10">
              View Sample Report
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
