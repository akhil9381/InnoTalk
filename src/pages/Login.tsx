import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";
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

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative hidden min-h-[620px] overflow-hidden bg-secondary/40 p-12 lg:block">
            <div className="absolute inset-0 bg-gradient-hero opacity-90" />
            <div className="absolute inset-0 bg-gradient-glow" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  InnoTalk
                </Link>
                <div className="mt-14 max-w-md">
                  <p className="text-sm uppercase tracking-[0.2em] text-primary">Welcome back</p>
                  <h1 className="mt-4 font-heading text-5xl font-bold leading-tight text-foreground">
                    Log in to access your startup readiness workspace.
                  </h1>
                  <p className="mt-5 text-base text-muted-foreground">
                    Sign in to continue simulations, review reports, and manage evaluation sessions.
                  </p>
                </div>
              </div>
              <div className="grid gap-4">
                {[
                  "Protected dashboard and reports",
                  "Saved evaluation sessions",
                  "Fast access to simulation tools",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-background/50 p-4 text-sm text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[620px] items-center p-6 sm:p-10"
          >
            <div className="mx-auto w-full max-w-md">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Login</p>
              <h2 className="mt-3 font-heading text-3xl font-bold text-foreground">Sign in to your account</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Use the account stored in the backend database to unlock the platform.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

                <Button type="submit" variant="hero" size="lg" className="w-full">
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
