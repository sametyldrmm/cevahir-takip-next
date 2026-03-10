"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { authApi, User, LoginDto, RegisterDto } from "@/lib/api/auth";
import { useNotification } from "./NotificationContext";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useNotification();

  // Sayfa yüklendiğinde token kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = Cookies.get("accessToken");
        const refreshToken = Cookies.get("refreshToken");

        if (!accessToken && !refreshToken) {
          setIsLoading(false);
          return;
        }

        if (!accessToken && refreshToken) {
          try {
            const refreshed = await authApi.refresh(refreshToken);
            setUser(refreshed.user);
            return;
          } catch {
            authApi.logout();
            setUser(null);
            return;
          }
        }

        if (accessToken) {
          try {
            const userData = await authApi.getProfile();
            setUser(userData);
          } catch {
            if (refreshToken) {
              try {
                const refreshed = await authApi.refresh(refreshToken);
                setUser(refreshed.user);
              } catch {
                authApi.logout();
                setUser(null);
              }
            } else {
              authApi.logout();
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("[Auth] Check auth error:", error);
        authApi.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (dto: LoginDto) => {
    try {
      const response = await authApi.login(dto);
      // Profil bilgilerini backend'den al
      const userData = await authApi.getProfile();
      setUser(userData);
      showSuccess("Giriş başarılı!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Giriş başarısız";
      showError(message);
      throw error;
    }
  };

  const register = async (dto: RegisterDto) => {
    try {
      const response = await authApi.register(dto);
      setUser(response.user);
      showSuccess("Kayıt başarılı!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Kayıt başarısız";
      showError(message);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    showSuccess("Çıkış yapıldı");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

