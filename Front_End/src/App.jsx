import React from 'react';
import Navbar from './components/common/Navbar';
import LoginPage from './Pages/LoginPage';

function App() {
  return (
    <div className="w-full min-h-screen bg-[#f7faf7] flex flex-col m-0 p-0 text-left">
      {/* Header / Navbar điều hướng dùng chung */}
      <Navbar />

      {/* Nội dung trang hiện tại */}
      <main className="flex-1 w-full flex flex-col">
        <LoginPage />
      </main>
    </div>
  );
}

export default App;