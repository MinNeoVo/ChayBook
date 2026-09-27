import { Routes, Route, useLocation } from "react-router-dom";

import Footer from "./components/common/Footer";
import Navbar from "./components/common/Navbar";

import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import ContentPage from "./Pages/ContentPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import CommunityPage from "./pages/CommunityPage";

function App() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  return (
    <div className="w-full min-h-screen bg-chaybook-bg flex flex-col m-0 p-0 text-left">
      <Navbar />

      <main className="flex-1 w-full flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/content" element={<ContentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/community" element={<CommunityPage />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default App;
