import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { User, InsertUser } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA?: boolean; email?: string; user?: User }>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [userState, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch current user
  const { data, isLoading } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const user = userState;

  useEffect(() => {
    if (data?.user) {
      setUserState(data.user);
      setIsAuthenticated(true);
    } else if (data === null) {
      setUserState(null);
      setIsAuthenticated(false);
    }
  }, [data]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(["/api/auth/me"], { user: data.user });
        setUserState(data.user);
        setIsAuthenticated(true);
      }
      // We already seeded the cache; explicit refetch can be triggered manually if needed.
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(["/api/auth/me"], { user: data.user });
        setUserState(data.user);
        setIsAuthenticated(true);
      }
      // Cache already updated with the new user.
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      setUserState(null);
      setIsAuthenticated(false);
    },
  });

  const login = async (email: string, password: string) => {
    await queryClient.cancelQueries({ queryKey: ["/api/auth/me"] });
    const result = await loginMutation.mutateAsync({ email, password });
    if (result?.user) {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
    return result;
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    await queryClient.cancelQueries({ queryKey: ["/api/auth/me"] });
    const result = await registerMutation.mutateAsync(data);
    if ((result as any)?.user) {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
