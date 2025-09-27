import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/Layout/MainLayout";
import { SuperAdminLayout } from "@/components/Layout/SuperAdminLayout";
import PlanStatusChecker from "@/components/PlanStatusChecker";
import { Dashboard } from "@/pages/Dashboard";
import { Students } from "@/pages/Students";
import { Teachers } from "@/pages/Teachers";
import { SubjectsGroups } from "@/pages/SubjectsGroups";
import { Schedule } from "@/pages/Schedule";
import { Payments } from "@/pages/Payments";
import { Events } from "@/pages/Events";
import { Settings } from "@/pages/Settings";
import { SuperAdminOverview } from "@/pages/SuperAdminOverview";
import { SuperAdminManagement } from "@/pages/SuperAdminManagement";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import PlanSelection from "@/pages/PlanSelection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 text-interactive border-2 border-interactive border-t-transparent rounded-full" />
          <p className="text-body text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Show super admin interface for super admin users
  if (user?.role === 'super_admin') {
    return (
      <Routes>
        <Route path="/login" element={<Navigate to="/super-admin" replace />} />
        <Route path="/signup" element={<Navigate to="/super-admin" replace />} />
        <Route path="/" element={<Navigate to="/super-admin" replace />} />
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminOverview />} />
          <Route path="management" element={<SuperAdminManagement />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Show regular interface for other users
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="/plan-selection" element={<PlanSelection />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="subjects" element={<SubjectsGroups />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="payments" element={<Payments />} />
        <Route path="events" element={<Events />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PlanStatusChecker>
            <AppRoutes />
          </PlanStatusChecker>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
