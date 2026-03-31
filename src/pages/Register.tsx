import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import type { LoginRole } from "@/lib/api";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [registerAs, setRegisterAs] = useState<LoginRole>("user");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const result = await register(
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.password,
      registerAs,
    );

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    navigate(result.role === "mentor" ? "/mentor-support" : "/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="panel-luxe relative grid w-full overflow-hidden rounded-[2rem] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="soft-grid absolute inset-0 opacity-40" />
          <div className="relative hidden min-h-[620px] overflow-hidden bg-secondary/30 p-12 lg:block">
            <div className="absolute inset-0 bg-gradient-hero opacity-90" />
            <div className="absolute inset-0 bg-gradient-glow" />
            <div className="absolute left-10 top-24 h-32 w-32 rounded-full bg-primary/20 blur-2xl animate-float-slow" />
            <div className="absolute bottom-16 right-12 h-44 w-44 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" />
            <div className="absolute right-10 top-12 h-24 w-24 rounded-3xl border border-white/10 bg-white/5 -rotate-12 shadow-card" />
            <div className="absolute left-14 bottom-10 h-16 w-40 rounded-[1.5rem] border border-white/10 bg-background/20 shadow-card" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-md">
                  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-background/20 p-10 shadow-[0_30px_90px_hsl(222_34%_4%/0.45)] backdrop-blur-sm">
                    <span className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/15 to-transparent blur-xl animate-shimmer-x" />
                    <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                    <Link to="/" className="mt-4 inline-block font-heading text-6xl font-bold leading-none text-foreground drop-shadow-[0_12px_30px_hsl(var(--primary)/0.12)]">
                      InnoTalk
                    </Link>
                    <div className="mt-8 grid grid-cols-3 gap-3">
                      <div className="flex min-h-[5.75rem] items-center justify-center rounded-2xl border border-white/10 bg-background/30 px-3 py-5 text-center text-[0.95rem] font-medium whitespace-nowrap text-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]">
                        Social
                      </div>
                      <div className="flex min-h-[5.75rem] items-center justify-center rounded-2xl border border-white/10 bg-background/30 px-3 py-5 text-center text-[0.95rem] font-medium whitespace-nowrap text-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)]">
                        Innovation
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
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">New account</p>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Register</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-3">
                  <Label>Who are you registering as?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegisterAs("user")}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        registerAs === "user"
                          ? "border-primary bg-primary/10 text-foreground shadow-[0_12px_30px_hsl(var(--primary)/0.12)]"
                          : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <div className="text-sm font-semibold">User</div>
                      <div className="mt-1 text-xs">Run evaluations and contact mentors when needed.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterAs("mentor")}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        registerAs === "mentor"
                          ? "border-primary bg-primary/10 text-foreground shadow-[0_12px_30px_hsl(var(--primary)/0.12)]"
                          : "border-border/60 bg-secondary/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <div className="text-sm font-semibold">Mentor</div>
                      <div className="mt-1 text-xs">Receive founder questions and respond from your inbox.</div>
                    </button>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(event) => handleChange("firstName", event.target.value)}
                      placeholder="Aarav"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(event) => handleChange("lastName", event.target.value)}
                      placeholder="Mehta"
                      required
                    />
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
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) => handleChange("confirmPassword", event.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full transition-transform duration-300 hover:scale-[1.01]">
                  Create Account
                </Button>
              </form>

              <p className="mt-6 text-sm text-muted-foreground">
                Already registered?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
