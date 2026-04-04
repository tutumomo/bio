import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Network, Dna } from "lucide-react";
import { useAutocomplete } from "@/hooks/useAutocomplete";
import type { SearchMode } from "@/types";

export function SearchBar() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<SearchMode>("gene");
  const { input, setInput, suggestions } = useAutocomplete();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (query?: string) => {
    const q = (query || input).trim();
    if (!q) return;
    setShowSuggestions(false);
    navigate(`/results?q=${encodeURIComponent(q)}&mode=${mode}`);
  };

  const placeholder =
    mode === "gene"
      ? "Search genes or proteins (e.g., BRCA1, TP53, EGFR)..."
      : "Search pathways (e.g., MAPK signaling, DNA repair, apoptosis)...";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Mode toggle */}
      <div className="flex justify-center gap-2">
        {(
          [
            { value: "gene" as SearchMode, label: "Gene / Protein", Icon: Dna },
            { value: "pathway" as SearchMode, label: "Pathway", Icon: Network },
          ] as const
        ).map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${
              mode === value
                ? "bg-white text-[#002045] shadow"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-600 rounded-2xl blur opacity-25" />
        <div className="relative bg-white flex items-center p-2 rounded-2xl shadow-xl">
          <Search className="text-slate-400 ml-4 w-5 h-5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full border-none focus:ring-0 bg-transparent py-4 px-4 text-slate-900 text-lg placeholder:text-slate-400"
            placeholder={placeholder}
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
            className="bg-[#002045] text-white px-8 py-4 rounded-xl font-bold tracking-tight hover:opacity-90 transition-all active:scale-95 shrink-0"
          >
            Search
          </button>
        </div>

        {/* Gene autocomplete (only in gene mode) */}
        {mode === "gene" && showSuggestions && suggestions.length > 0 && (
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
    </div>
  );
}
