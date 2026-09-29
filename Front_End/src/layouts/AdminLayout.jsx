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
} from "lucide-react";

import { useAuth } from "../context/useAuth";

function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Admin logout failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center border-b border-gray-200 px-6">
          <Link to="/" className="text-xl font-bold text-chaybook-primary">
            ChayBook Admin
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-chaybook-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="shrink-0 space-y-2 border-t border-gray-200 p-4">
          {/* Back to ChayBook */}
          <Link
            to="/"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            <span>Back to ChayBook</span>
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
