import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

const publicNavLinks = [
  { label: "Home", path: "/" },
];

const privateNavLinks = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Simulation", path: "/simulation" },
  { label: "Results", path: "/results" },
  { label: "Mentor Support", path: "/mentor-support" },
];

const mentorNavLinks = [{ label: "Mentor Support", path: "/mentor-support" }];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const navLinks = !isAuthenticated
    ? publicNavLinks
    : user?.role === "mentor"
      ? mentorNavLinks
      : privateNavLinks;

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-4 left-0 right-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="nav-shell mx-auto flex h-16 items-center justify-between rounded-2xl px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow transition-transform duration-300 group-hover:scale-105">
            <Zap className="w-4 h-4 text-primary-foreground" />
            <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground transition-colors duration-300 group-hover:text-primary">InnoTalk</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                location.pathname === link.path
                  ? "text-primary bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  {user?.fullName ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.role === "mentor" ? "Mentor" : user?.email}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
                Log Out
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to={user?.role === "mentor" ? "/mentor-support" : "/dashboard"}>
                  {user?.role === "mentor" ? "Inbox" : "Dashboard"}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground transition-transform duration-300 hover:scale-105" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden"
          >
            <div className="container mx-auto px-4 sm:px-6 pt-3">
              <div className="nav-shell flex flex-col gap-2 rounded-2xl px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    location.pathname === link.path
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 mt-2">
                <ThemeToggle />
                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => void handleLogout()}>
                      Log Out
                    </Button>
                    <Button variant="hero" size="sm" className="flex-1" asChild>
                      <Link to={user?.role === "mentor" ? "/mentor-support" : "/dashboard"}>
                        {user?.role === "mentor" ? "Inbox" : "Dashboard"}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1" asChild>
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button variant="hero" size="sm" className="flex-1" asChild>
                      <Link to="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
