import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-full transition-colors ${
          theme === "light"
            ? "bg-white dark:bg-slate-700 text-amber-500 shadow-sm"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-full transition-colors ${
          theme === "system"
            ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
        title="System Mode"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-full transition-colors ${
          theme === "dark"
            ? "bg-white dark:bg-slate-700 text-indigo-400 shadow-sm"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
