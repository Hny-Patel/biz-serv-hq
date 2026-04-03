import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ShopPage from "./pages/ShopPage";
import CustomersPage from "./pages/CustomersPage";
import ServicesPage from "./pages/ServicesPage";
import ProposalsPage from "./pages/ProposalsPage";
import ProposalFormPage from "./pages/ProposalFormPage";
import JobsPage from "./pages/JobsPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceFormPage from "./pages/InvoiceFormPage";
import CurrenciesPage from "./pages/CurrenciesPage";
import BillingPage from "./pages/BillingPage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import NotFound from "./pages/NotFound";
import { MinimalLayout } from "./components/layout/MinimalLayout";

const queryClient = new QueryClient();

function RoleBasedIndex() {
  const { primaryRole, profile } = useAuth();

  // Check approval for customers/vendors
  if ((primaryRole === "customer" || primaryRole === "vendor") && !profile?.is_approved) {
    return <Navigate to="/pending-approval" replace />;
  }

  switch (primaryRole) {
    case "super_admin": return <Navigate to="/admin" replace />;
    case "customer": return <Navigate to="/customer" replace />;
    case "vendor": return <Navigate to="/vendor" replace />;
    default: return <DashboardPage />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Pending approval */}
            <Route path="/pending-approval" element={
              <ProtectedRoute><PendingApprovalPage /></ProtectedRoute>
            } />

            {/* Customer portal */}
            <Route path="/customer" element={
              <ProtectedRoute requiredRoles={["customer"]}>
                <MinimalLayout title="Customer Portal" />
              </ProtectedRoute>
            }>
              <Route index element={<CustomerDashboard />} />
            </Route>

            {/* Vendor portal */}
            <Route path="/vendor" element={
              <ProtectedRoute requiredRoles={["vendor"]}>
                <MinimalLayout title="Vendor Portal" />
              </ProtectedRoute>
            }>
              <Route index element={<VendorDashboard />} />
            </Route>

            {/* Company owner / admin app routes */}
            <Route
              element={
                <ProtectedRoute requiredRoles={["super_admin", "company_owner", "admin", "manager", "staff"]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<RoleBasedIndex />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/proposals/new" element={<ProposalFormPage />} />
              <Route path="/proposals/:id/edit" element={<ProposalFormPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/new" element={<InvoiceFormPage />} />
              <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />
              <Route path="/currencies" element={<CurrenciesPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<ProtectedRoute requiredRoles={["super_admin"]}><SuperAdminPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
