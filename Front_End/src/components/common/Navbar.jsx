import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  BookMarked,
  LogIn,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import Avatar from "./Avatar.jsx";
import NotificationBell from "./NotificationBell.jsx";

import { useAuth } from "../../context/useAuth";

import Button from "./Button";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();

  const navItems = [
    { name: "Trang chủ", path: "/", end: true },
    { name: "Bài viết", path: "/content" },
    ...(isLoggedIn ? [{ name: "Cộng đồng", path: "/community" }] : []),
    { name: "Trợ lý AI", path: "/ai-assistant" },
    ...(isLoggedIn
      ? [{ name: "Nhận diện", path: "/ingredient-recognition" }]
      : []),
    { name: "Công thức", path: "/recipes" },
    ...(isLoggedIn ? [{ name: "Địa điểm", path: "/places" }] : []),
    ...(isLoggedIn ? [{ name: "Phân tích", path: "/video-analysis" }] : []),

    { name: "Thực đơn", path: "/meal-plan" },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleMobileLogout = async () => {
    closeMobileMenu();
    await logout();
  };

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-chaybook-bg/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-2 px-4 sm:h-20 sm:gap-6 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex shrink-0 items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-chaybook-primary text-lg font-bold text-white shadow-sm">
            C
          </div>

          <span className="text-lg font-bold tracking-tight text-chaybook-primary sm:text-xl">
            ChayBook
          </span>
        </Link>

        {/* Desktop navigation (enough room for all nine links and admin actions) */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden min-w-0 flex-1 items-center justify-center gap-5 min-[1440px]:flex"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `relative shrink-0 whitespace-nowrap py-7 text-sm font-semibold transition-colors ${
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

        {/* Actions + Mobile Menu Button */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3.5">
          {/* Desktop Login / Logout */}
          {isLoggedIn ? (
            <Button
              type="button"
              size="md"
              onClick={logout}
              className="hidden h-10 whitespace-nowrap py-2 min-[1440px]:inline-flex"
            >
              Đăng xuất
            </Button>
          ) : (
            <Link to="/login" className="hidden min-[1440px]:block">
              <Button
                type="button"
                size="md"
                className="h-10 whitespace-nowrap py-2"
              >
                Đăng nhập / Đăng ký
              </Button>
            </Link>
          )}

          {/* Notifications (User only) + Profile */}
          {isLoggedIn && user?.role !== "ADMIN" && <NotificationBell />}

          {isLoggedIn && (
            <Link
              to="/profile"
              onClick={closeMobileMenu}
              aria-label="Tài khoản người dùng"
              className="flex h-9 w-9 shrink-0 rounded-full shadow-sm transition-opacity hover:opacity-80 sm:h-10 sm:w-10"
            >
              <Avatar
                src={user?.avatarUrl}
                alt={user?.fullName || "Ảnh đại diện người dùng"}
                size="md"
              />
            </Link>
          )}

          {/* Hamburger Toggle Button (< 1440px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={
              mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-2xs transition-colors hover:border-chaybook-primary/40 hover:bg-chaybook-container hover:text-chaybook-primary min-[1440px]:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile / Tablet Menu (< 1440px) */}
      {mobileMenuOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={closeMobileMenu}
            className="fixed inset-x-0 top-16 bottom-0 z-40 bg-black/25 backdrop-blur-[1px] sm:top-20 min-[1440px]:hidden"
          />

          <div
            id="mobile-navigation-menu"
            role="dialog"
            aria-label="Menu điều hướng di động"
            className="relative z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-gray-200 bg-chaybook-bg px-4 pt-3 pb-5 shadow-xl sm:max-h-[calc(100dvh-5rem)] sm:px-6 min-[1440px]:hidden"
          >
            <nav
              aria-label="Điều hướng di động"
              className="grid grid-cols-1 gap-1 sm:grid-cols-2"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.end}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-chaybook-primary text-white shadow-xs"
                        : "text-gray-700 hover:bg-chaybook-container hover:text-chaybook-primary"
                    }`
                  }
                >
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-3 border-t border-gray-200/80 pt-3">
              {isLoggedIn ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-2xs">
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <Avatar
                        src={user?.avatarUrl}
                        alt={user?.fullName || "Ảnh đại diện người dùng"}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {user?.fullName || user?.username || "Thành viên ChayBook"}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {user?.email || "Xem hồ sơ cá nhân"}
                        </p>
                      </div>
                    </Link>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Link
                        to="/profile"
                        onClick={closeMobileMenu}
                        className="inline-flex items-center gap-1 rounded-lg bg-chaybook-container px-2.5 py-1.5 text-xs font-semibold text-chaybook-primary transition-colors hover:bg-chaybook-secondary-container"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Hồ sơ</span>
                      </Link>
                      <Link
                        to="/my-recipes"
                        onClick={closeMobileMenu}
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        <BookMarked className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Công thức đã lưu</span>
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleMobileLogout}
                      className="h-10 flex-1 gap-2 py-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </Button>
                  </div>
                </div>
              ) : (
                <Link to="/login" onClick={closeMobileMenu} className="block">
                  <Button
                    type="button"
                    size="md"
                    className="h-11 w-full gap-2 py-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Đăng nhập / Đăng ký
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default Navbar;
