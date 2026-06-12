import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  CreditCard,
  Smartphone,
  LogOut,
  Menu,
  X,
  Store,
  AlertTriangle,
  ChevronDown,
  Moon,
  Sun
} from "lucide-react";

export default function Layout({ children }) {
  const { user, tenant, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isTrial = tenant?.status === "TRIAL";
  const trialDaysLeft = tenant?.trialEndsAt
    ? Math.ceil((new Date(tenant.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/sales", label: "New Sale", icon: ShoppingCart },
    { path: "/products", label: "Products", icon: Package },
    { path: "/reports", label: "Reports", icon: BarChart3 },
  ];

  const adminItems = [
    { path: "/users", label: "Users", icon: Users },
    { path: "/settings", label: "Settings", icon: Settings },
    { path: "/billing", label: "Billing", icon: CreditCard },
    { path: "/momo", label: "MoMo Setup", icon: Smartphone },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-pos-dark text-white transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pos-blue rounded-xl flex items-center justify-center">
                <Store size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg truncate">{tenant?.name || "WAG POS"}</h2>
                <p className="text-xs text-gray-400">{tenant?.slug && `@${tenant.slug}`}</p>
              </div>
            </div>
          </div>

          {/* Trial Alert */}
          {isTrial && trialDaysLeft <= 7 && (
            <div className="mx-4 mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-300">
                    Trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}
                  </p>
                  <button
                    onClick={() => navigate("/billing")}
                    className="text-xs text-amber-200 hover:text-white underline mt-0.5"
                  >
                    Upgrade now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Main</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-pos-blue text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}

            {user?.role === "ADMIN" && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-3">
                  Administration
                </p>
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? "bg-pos-blue text-white"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Theme Toggle */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="w-9 h-9 bg-pos-blue rounded-full flex items-center justify-center text-sm font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.role}</p>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl shadow-lg border overflow-hidden bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700">
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <Menu size={20} className="text-gray-800 dark:text-white" />
          </button>
          <h1 className="font-bold text-pos-dark dark:text-white">{tenant?.name || "WAG POS"}</h1>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto bg-gray-50 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}