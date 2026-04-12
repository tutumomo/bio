import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Search, Dna, Clock, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { path: "/", label: "Search", icon: Search },
  { path: "/history", label: "History", icon: Clock },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed left-0 top-0 pt-20 pb-8 px-4 z-40">
        <div className="mb-10 px-2">
          <h2 className="font-extrabold text-[#002045] dark:text-slate-100 text-xl tracking-tight">Helix Bio</h2>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">
            Variant Annotation v1.0
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active 
                    ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <Dna className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <div className="flex items-center gap-1.5">
              {["NCBI", "Ensembl", "RegDB"].map((db) => (
                <span key={db} className="w-2 h-2 rounded-full bg-emerald-400" title={`${db} connected`} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* TopNav */}
      <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center px-6 py-3 ml-64">
          <span className="text-xl font-bold tracking-tighter text-[#002045] dark:text-slate-100">
            Editorial Bioinformatics
          </span>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{user?.name ?? user?.email}</span>
                  {user?.avatar_url && (
                    <img
                      src={user.avatar_url}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700"
                      alt="avatar"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <button
                    onClick={logout}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => login("google")}
                    className="px-4 py-2 text-xs font-bold bg-[#002045] dark:bg-blue-600 text-white rounded-lg hover:opacity-90"
                  >
                    Sign in with Google
                  </button>
                  <button
                    onClick={() => login("github")}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 text-[#002045] dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    GitHub
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 pt-20 pb-12 px-6 lg:px-12 max-w-[1600px]">
        <Outlet />
      </main>
    </div>
  );
}
