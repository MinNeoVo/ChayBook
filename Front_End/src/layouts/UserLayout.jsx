import { Navigate, Outlet, useMatch } from "react-router-dom";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/useAuth";

function UserLayout() {
  const { user, loading } = useAuth();
  const isArticleDetail = useMatch("/content/:id") !== null;

  if (loading) {
    return null;
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
