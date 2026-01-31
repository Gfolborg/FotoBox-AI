import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { getApiUrl } from "@/lib/query-client";

interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface Subscription {
  plan: string;
  status: string;
  creditsRemaining: number;
  creditsTotal: number;
  expiresAt: string | null;
}

interface OAuthParams {
  provider: "google" | "apple";
  idToken: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  oauthLogin: (params: OAuthParams) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  useCredit: (action: string) => Promise<{ success: boolean; creditsRemaining: number; requiresUpgrade?: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "@fotobox_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        await fetchUserData(storedToken);
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async (authToken: string) => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/auth/me", baseUrl).toString(), {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSubscription(data.subscription);
      } else {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
        setSubscription(null);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/auth/login", baseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setSubscription(data.subscription);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (username: string, password: string, confirmPassword: string) => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/auth/register", baseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setSubscription(data.subscription);

      return { success: true };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const oauthLogin = async (params: OAuthParams) => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/auth/oauth", baseUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "OAuth login failed" };
      }

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setSubscription(data.subscription);

      return { success: true };
    } catch (error) {
      console.error("OAuth error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    try {
      if (GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    } catch (error) {
      console.error("Google sign-out error:", error);
    }

    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setSubscription(null);
  };

  const refreshSubscription = async () => {
    if (!token) return;

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/subscription", baseUrl).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
    }
  };

  const useCredit = async (action: string) => {
    if (!token) {
      return { success: false, creditsRemaining: 0, requiresUpgrade: true, error: "Not authenticated" };
    }

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/subscription/use-credit", baseUrl).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          creditsRemaining: data.creditsRemaining || 0,
          requiresUpgrade: data.requiresUpgrade || false,
          error: data.error,
        };
      }

      await refreshSubscription();
      return { success: true, creditsRemaining: data.creditsRemaining };
    } catch (error) {
      console.error("Use credit error:", error);
      return { success: false, creditsRemaining: 0, error: "Network error" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        oauthLogin,
        logout,
        refreshSubscription,
        useCredit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
