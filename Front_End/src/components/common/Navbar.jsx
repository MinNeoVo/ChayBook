import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Search, User } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import Input from "./Input";

function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isLoggedIn, logout } = useAuth();

  // Danh sách 5 menu items
  const navItems = [
    { name: "Home", path: "/", end: true },
    { name: "Content", path: "/content" },
    ...(isLoggedIn ? [{ name: "Community", path: "/community" }] : []),
    { name: "AI Assistant", path: "/ai-assistant" },
    { name: "BMI Analysis", path: "/bmi" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-chaybook-bg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* ================= LEFT SIDE: LOGO + NAVIGATION ================= */}
        <div className="flex items-center gap-8">
          {/* Logo ChayBook */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-full bg-chaybook-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-chaybook-primary">
              ChayBook
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors py-7 relative whitespace-nowrap ${
                    isActive
                      ? "text-chaybook-primary"
                      : "text-gray-700 hover:text-chaybook-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.name}
                    {/* Thanh gạch chân màu xanh khi active */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-chaybook-primary rounded-full" />
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
              className="bg-chaybook-container border-transparent focus:bg-white"
            />
          </div>

          {/* Nút Login / Sign Up */}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-chaybook-primary text-white font-semibold text-sm hover:bg-chaybook-hover transition-colors shadow-sm whitespace-nowrap"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-chaybook-primary text-white font-semibold text-sm hover:bg-chaybook-hover transition-colors shadow-sm whitespace-nowrap"
            >
              Login / Sign Up
            </Link>
          )}

          {/* Icon Profile User */}
          {isLoggedIn && (
            <Link
              to="/profile"
              aria-label="User Account"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-chaybook-primary text-white hover:bg-chaybook-hover transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
