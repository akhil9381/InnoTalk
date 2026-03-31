import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import type { LoginRole } from "@/lib/api";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [loginAs, setLoginAs] = useState<LoginRole>("user");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (field: "email" | "password", value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await login(formData.email, formData.password, loginAs);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    navigate(result.role === "mentor" ? "/mentor-support" : redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="panel-luxe relative grid w-full overflow-hidden rounded-[2rem] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="soft-grid absolute inset-0 opacity-40" />
          <div className="relative hidden min-h-[620px] overflow-hidden bg-secondary/30 p-12 lg:block">
            <div className="absolute inset-0 bg-gradient-hero opacity-90" />
            <div className="absolute inset-0 bg-gradient-glow" />
            <div className="absolute left-10 top-20 h-32 w-32 rounded-full bg-primary/20 blur-2xl animate-float-slow" />
            <div className="absolute bottom-16 right-12 h-44 w-44 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" />
            <div className="absolute right-10 top-12 h-24 w-24 rounded-3xl border border-white/10 bg-white/5 rotate-12 shadow-card" />
            <div className="absolute left-14 bottom-10 h-16 w-40 rounded-[1.5rem] border border-white/10 bg-background/20 shadow-card" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-md">
                  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-background/20 p-10 shadow-[0_30px_90px_hsl(222_34%_4%/0.45)] backdrop-blur-sm">
                    <span className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/15 to-transparent blur-xl animate-shimmer-x" />
                    <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                    <p className="text-sm uppercase tracking-[0.2em] text-primary">Welcome back</p>
                    <Link to="/" className="mt-4 inline-block font-heading text-6xl font-bold leading-none text-foreground drop-shadow-[0_12px_30px_hsl(var(--primary)/0.12)]">
                      InnoTalk
                    </Link>
                    <div className="mt-8 grid grid-cols-3 gap-3">
                      <div className="flex min-h-[5.75rem] items-center justify-center rounded-2xl border border-white/10 bg-background/30 px-3 py-5 text-center text-[0.95rem] font-medium whitespace-nowrap text-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]">
                        Reports
                      </div>
                      <div className="flex min-h-[5.75rem] items-center justify-center rounded-2xl border border-white/10 bg-background/30 px-3 py-5 text-center text-[0.95rem] font-medium whitespace-nowrap text-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]">
                        Simulation
                      </div>
                      <div className="flex min-h-[5.75rem] items-center justify-center rounded-2xl border border-white/10 bg-background/30 px-3 py-5 text-center text-[0.95rem] font-medium whitespace-nowrap text-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]">
                        Readiness
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative flex min-h-[620px] items-center p-6 sm:p-10"
          >
            <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-white/6 bg-background/20 p-8 shadow-[0_30px_70px_hsl(222_34%_4%/0.25)] backdrop-blur-sm">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Login</p>
              <h2 className="mt-3 font-heading text-3xl font-bold text-foreground">Sign in to your account</h2>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-3">
                  <Label>Who is logging in?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLoginAs("user")}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        loginAs === "user"
                          ? "border-primary bg-primary/10 text-foreground shadow-[0_12px_30px_hsl(var(--primary)/0.12)]"
                          : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <div className="text-sm font-semibold">User</div>
                      <div className="mt-1 text-xs">Access simulation, reports, and mentor support.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginAs("mentor")}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        loginAs === "mentor"
                          ? "border-primary bg-primary/10 text-foreground shadow-[0_12px_30px_hsl(var(--primary)/0.12)]"
                          : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <div className="text-sm font-semibold">Mentor</div>
                      <div className="mt-1 text-xs">Open your inbox and reply to founder questions.</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    placeholder="founder@startup.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => handleChange("password", event.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full transition-transform duration-300 hover:scale-[1.01]">
                  Log In
                </Button>
              </form>

              <p className="mt-6 text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Create one here
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
