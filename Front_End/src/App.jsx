//import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Footer from "./components/common/Footer";
import Navbar from "./components/common/Navbar";

import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import ContentPage from "./Pages/ContentPage";

function App() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  return (
    <div className="w-full min-h-screen bg-chaybook-bg flex flex-col m-0 p-0 text-left">
      <Navbar />

      <main className="flex-1 w-full flex flex-col">
        <Routes>
          {/* <Route path="/" element={<LoginPage />} /> */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/content" element={<ContentPage />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default App;
