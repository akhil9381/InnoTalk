import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
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
    );

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[620px] items-center p-6 sm:p-10"
          >
            <div className="mx-auto w-full max-w-md">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Register</p>
              <h1 className="mt-3 font-heading text-3xl font-bold text-foreground">Create your account</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Register once and the app will keep the rest of the platform behind your login.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

                <Button type="submit" variant="hero" size="lg" className="w-full">
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

          <div className="relative hidden min-h-[620px] overflow-hidden bg-secondary/40 p-12 lg:block">
            <div className="absolute inset-0 bg-gradient-hero opacity-90" />
            <div className="absolute inset-0 bg-gradient-glow" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  InnoTalk
                </Link>
                <div className="mt-14 max-w-md">
                  <p className="text-sm uppercase tracking-[0.2em] text-primary">New account</p>
                  <h2 className="mt-4 font-heading text-5xl font-bold leading-tight text-foreground">
                    Start from the homepage, then unlock the full experience.
                  </h2>
                  <p className="mt-5 text-base text-muted-foreground">
                    Once you register, protected pages like dashboard, simulation, and results become available.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-background/50 p-4 text-sm text-foreground">
                  Home page stays public with clear login and register paths.
                </div>
                <div className="rounded-2xl border border-white/10 bg-background/50 p-4 text-sm text-foreground">
                  Dashboard, simulation, and reports require authentication.
                </div>
                <div className="rounded-2xl border border-white/10 bg-background/50 p-4 text-sm text-foreground">
                  Registration signs users in immediately after account creation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
