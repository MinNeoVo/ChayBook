import { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  FileText,
  ChefHat,
  Video,
  MessageSquare,
  ArrowLeft,
  LogOut,
  Leaf,
  Menu,
  X,
} from "lucide-react";

import { useAuth } from "../context/useAuth";

function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      end: true,
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      name: "Articles",
      path: "/admin/articles",
      icon: FileText,
    },
    {
      name: "Recipes",
      path: "/admin/recipes",
      icon: ChefHat,
    },
    {
      name: "Videos",
      path: "/admin/videos",
      icon: Video,
    },
    {
      name: "Posts",
      path: "/admin/posts",
      icon: MessageSquare,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setSidebarOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Admin logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] md:hidden"
        />
      )}

      <aside
        className={
          "fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col bg-[#16a34a] text-white shadow-xl transition-transform duration-200 md:translate-x-0 " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/20 px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Leaf aria-hidden="true" size={23} />
          </span>
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="min-w-0"
          >
            <span className="block truncate text-lg font-bold tracking-tight">
              ChayBook
            </span>
            <span className="block text-xs font-medium text-white/75">
              Admin Panel
            </span>
          </Link>
        </div>

        <nav
          aria-label="Admin navigation"
          className="flex-1 space-y-1 overflow-y-auto p-4"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors " +
                  (isActive
                    ? "bg-white/25 text-white shadow-sm"
                    : "text-white/90 hover:bg-white/15 hover:text-white")
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-white/20 p-4">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            <span>Back to ChayBook</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/15 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            aria-label={sidebarOpen ? "Close admin menu" : "Open admin menu"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50"
          >
            {sidebarOpen ? (
              <X aria-hidden="true" size={19} />
            ) : (
              <Menu aria-hidden="true" size={19} />
            )}
          </button>
          <div>
            <p className="text-sm font-bold text-slate-900">ChayBook Admin</p>
            <p className="text-xs text-slate-500">Administration</p>
          </div>
        </header>
        <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
