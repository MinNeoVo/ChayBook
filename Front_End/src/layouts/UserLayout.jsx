import { Outlet } from "react-router-dom";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

function UserLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-chaybook-bg text-left">
      <Navbar />

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default UserLayout;
