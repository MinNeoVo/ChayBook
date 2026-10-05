// import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Avatar from "./Avatar.jsx";

import { useAuth } from "../../context/useAuth";

import Button from "./Button";

function Navbar() {
  // const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoggedIn, logout } = useAuth();

  const navItems = [
    { name: "Home", path: "/", end: true },
    { name: "Content", path: "/content" },
    ...(isLoggedIn ? [{ name: "Community", path: "/community" }] : []),
    { name: "AI Assistant", path: "/ai-assistant" },
    { name: "Recipes", path: "/recipes" },
    { name: "Meal Plan", path: "/meal-plan" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-chaybook-bg shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-chaybook-primary text-lg font-bold text-white shadow-sm">
              C
            </div>

            <span className="text-xl font-bold tracking-tight text-chaybook-primary">
              ChayBook
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `relative whitespace-nowrap py-7 text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-chaybook-primary"
                      : "text-gray-700 hover:text-chaybook-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.name}

                    {isActive && (
                      <span className="absolute bottom-0 left-0 h-[2.5px] w-full rounded-full bg-chaybook-primary" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Search + Actions */}
        <div className="flex items-center gap-3.5">
          {isLoggedIn && user?.role === "ADMIN" && (
            <Link to="/admin">
              <Button
                type="button"
                size="md"
                className="h-10 whitespace-nowrap py-2"
              >
                Admin Dashboard
              </Button>
            </Link>
          )}

          {/* Login / Logout */}
          {isLoggedIn ? (
            <Button
              type="button"
              size="md"
              onClick={logout}
              className="h-10 whitespace-nowrap py-2 "
            >
              Logout
            </Button>
          ) : (
            <Link to="/login">
              <Button
                type="button"
                size="md"
                className="h-10 whitespace-nowrap py-2 "
              >
                Login / Sign Up
              </Button>
            </Link>
          )}

          {/* Profile */}
          {/* Profile */}
          {isLoggedIn && (
            <Link
              to="/profile"
              aria-label="User Account"
              className="flex h-10 w-10 shrink-0 rounded-full shadow-sm transition-opacity hover:opacity-80 border-spacing-x-0.5 "
            >
              <Avatar
                src={user?.avatarUrl}
                alt={user?.fullName || "User avatar"}
                size="md"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
