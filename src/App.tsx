import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import QuestBook from "./pages/QuestBook";
import MotivationQuotes from "./pages/MotivationQuotes";
import Reflections from "./pages/Reflections";
import SelfHelpResources from "./pages/SelfHelpResources";
import SideQuest from "./pages/SideQuest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/sidequest" element={<ProtectedRoute><SideQuest /></ProtectedRoute>} />
              <Route path="/questbook" element={<ProtectedRoute><QuestBook /></ProtectedRoute>} />
              <Route path="/questbook/motivation" element={<ProtectedRoute><MotivationQuotes /></ProtectedRoute>} />
              <Route path="/questbook/reflections" element={<ProtectedRoute><Reflections /></ProtectedRoute>} />
              <Route path="/questbook/selfhelp" element={<ProtectedRoute><SelfHelpResources /></ProtectedRoute>} />
              <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
