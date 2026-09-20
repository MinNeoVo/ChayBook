import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, Bookmark, User } from 'lucide-react';
import Input from './Input';

function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');

  // Danh sách 5 menu items
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Content', path: '/content' },
    { name: 'Community', path: '/community' },
    { name: 'AI Assistant', path: '/ai-assistant' },
    { name: 'BMI Analysis', path: '/bmi' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f7faf7] border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        
        {/* ================= LEFT SIDE: LOGO + NAVIGATION ================= */}
        <div className="flex items-center gap-8">
          {/* Logo ChayBook */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#006b2c] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-[#006b2c]">
              ChayBook
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors py-7 relative whitespace-nowrap ${
                    isActive ? 'text-[#006b2c]' : 'text-gray-700 hover:text-[#006b2c]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.name}
                    {/* Thanh gạch chân màu xanh khi active */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#006b2c] rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ================= RIGHT SIDE: SEARCH + ACTIONS ================= */}
        <div className="flex items-center gap-3.5">
          {/* Ô tìm kiếm */}
          <div className="w-48 lg:w-64">
            <Input
              icon={Search}
              placeholder="Search plant-based recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#f1f4f1] border-transparent focus:bg-white"
            />
          </div>

          {/* Nút Bookmark */}
          <button
            type="button"
            aria-label="Bookmark"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-700 hover:bg-[#eaf1ec] transition-colors cursor-pointer border-none bg-transparent"
          >
            <Bookmark className="w-5 h-5" />
          </button>

          {/* Nút Login / Sign Up */}
          <Link
            to="/login"
            className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-[#006b2c] text-white font-semibold text-sm hover:bg-[#00873a] transition-colors shadow-sm whitespace-nowrap text-decoration-none"
          >
            Login / Sign Up
          </Link>

          {/* Icon Profile User */}
          <Link
            to="/profile"
            aria-label="User Account"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006b2c] text-white hover:bg-[#00873a] transition-colors shadow-sm cursor-pointer shrink-0"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </header>
  );
}

export default Navbar;