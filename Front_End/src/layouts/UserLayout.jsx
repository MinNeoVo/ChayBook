import { Navigate, Outlet, useMatch } from "react-router-dom";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/useAuth";

function UserLayout() {
  const { user, loading } = useAuth();
  const isArticleDetail = useMatch("/content/:id") !== null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-chaybook-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-chaybook-primary border-t-transparent" />
          <span className="text-sm font-medium text-gray-500">Đang tải ChayBook...</span>
        </div>
      </div>
    );
  }

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div
      className={`flex w-full flex-col bg-chaybook-bg text-left ${
        isArticleDetail ? "" : "min-h-screen"
      }`}
    >
      <Navbar />

      <main className={`${isArticleDetail ? "" : "flex-1"} min-w-0 w-full overflow-x-hidden`}>
        <Outlet />
      </main>

      {!isArticleDetail && <Footer />}
    </div>
  );
}

export default UserLayout;
