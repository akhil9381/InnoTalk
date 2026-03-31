import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EvaluationProvider } from "@/context/EvaluationContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Simulation from "./pages/Simulation.tsx";
import Results from "./pages/Results.tsx";
import MentorSupport from "./pages/MentorSupport.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <EvaluationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["user", "admin", "partner"]} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/simulation" element={<Simulation />} />
                <Route path="/results" element={<Results />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["user", "mentor"]} />}>
                <Route path="/mentor-support" element={<MentorSupport />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </EvaluationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
