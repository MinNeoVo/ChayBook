import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Footer from './components/common/Footer';
import Navbar from './components/common/Navbar';
import LoginPage from './Pages/LoginPage';

function App() {
  return (
    <div className="w-full min-h-screen bg-[#f7faf7] flex flex-col m-0 p-0 text-left">

      <Navbar />

      <main className="flex-1 w-full flex flex-col">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;