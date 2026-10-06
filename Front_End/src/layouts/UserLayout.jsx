import { Outlet, useMatch } from "react-router-dom";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

function UserLayout() {
  const isArticleDetail = useMatch("/content/:id") !== null;

  return (
    <div
      className={`flex w-full flex-col bg-chaybook-bg text-left ${
        isArticleDetail ? "" : "min-h-screen"
      }`}
    >
      <Navbar />

      <main className={`${isArticleDetail ? "" : "flex-1"} w-full`}>
        <Outlet />
      </main>

      {!isArticleDetail && <Footer />}
    </div>
  );
}

export default UserLayout;
