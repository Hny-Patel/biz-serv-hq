import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { session, loading, roles, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If customer/vendor not approved, redirect to pending page
  const isCustomerOrVendor = roles.includes("customer") || roles.includes("vendor");
  const onlyCustomerOrVendor = roles.every((r) => r === "customer" || r === "vendor");
  if (onlyCustomerOrVendor && isCustomerOrVendor && profile && !profile.is_approved) {
    // Allow access to pending-approval page
    if (window.location.pathname !== "/pending-approval") {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some((r) => roles.includes(r));
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
