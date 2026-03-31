import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const CTASection = () => {
  const { isAuthenticated } = useAuth();

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
          <h2 className="font-heading text-3xl font-bold leading-[1.08] md:text-5xl mb-6">
            Ready to <span className="inline-block text-[1.03em] font-bold leading-none text-gradient-primary">Validate</span> Your Social Innovation?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join mission-driven founders building stronger solutions for communities, institutions, and underserved markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="text-base px-10" asChild>
              <Link to={isAuthenticated ? "/simulation" : "/login"}>
                {isAuthenticated ? "Start Impact Simulation" : "Login to Access"} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-10" asChild>
              <Link to={isAuthenticated ? "/results" : "/register"}>
                {isAuthenticated ? "View Impact Report" : "Register Now"}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
