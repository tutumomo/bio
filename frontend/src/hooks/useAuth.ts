import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["user"],
    queryFn: api.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const login = (provider: "google" | "github") => {
    window.location.href = `/api/auth/login/${provider}`;
  };

  const logout = async () => {
    await fetch("/api/user/logout", { method: "POST", credentials: "include" });
    queryClient.removeQueries({ queryKey: ["user"] });
  };

  return { user: user ?? null, isLoading, isAuthenticated: !!user, login, logout };
}
