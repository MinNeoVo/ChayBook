import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chaybook-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-chaybook-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
