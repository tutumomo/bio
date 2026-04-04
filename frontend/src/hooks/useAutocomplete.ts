import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

export function useAutocomplete() {
  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["autocomplete", debouncedInput],
    queryFn: () => api.autocomplete(debouncedInput),
    enabled: debouncedInput.length >= 2,
    staleTime: 5 * 60_000,
  });

  return { input, setInput, suggestions };
}
