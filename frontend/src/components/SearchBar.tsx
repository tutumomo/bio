import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useAutocomplete } from "@/hooks/useAutocomplete";

export function SearchBar() {
  const navigate = useNavigate();
  const { input, setInput, suggestions } = useAutocomplete();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (query?: string) => {
    const q = (query || input).trim();
    if (!q) return;
    setShowSuggestions(false);
    navigate(`/results?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-600 rounded-2xl blur opacity-25" />
      <div className="relative bg-white flex items-center p-2 rounded-2xl shadow-xl">
        <Search className="text-slate-400 ml-4 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          className="w-full border-none focus:ring-0 bg-transparent py-4 px-4 text-slate-900 text-lg placeholder:text-slate-400"
          placeholder="Search genes or proteins (e.g., BRCA1, TP53, EGFR)..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        <button
          onClick={() => handleSearch()}
          className="bg-[#002045] text-white px-8 py-4 rounded-xl font-bold tracking-tight hover:opacity-90 transition-all active:scale-95"
        >
          Search
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          {suggestions.map((s: { symbol: string; name: string }) => (
            <button
              key={s.symbol}
              className="w-full px-6 py-3 text-left hover:bg-slate-50 flex items-center gap-3"
              onMouseDown={() => handleSearch(s.symbol)}
            >
              <span className="font-bold text-[#002045]">{s.symbol}</span>
              <span className="text-sm text-slate-500 truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
