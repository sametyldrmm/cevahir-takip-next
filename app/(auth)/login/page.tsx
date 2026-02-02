"use client";

import LoginView from "@/app/components/LoginView";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    try {
      await login({ username, password });
      router.push("/");
    } catch (error) {
      // Error handling AuthContext'te yapılıyor
    }
  };

  const handleGuest = () => {
    // Guest mode kaldırıldı - authentication zorunlu
    router.push("/register");
  };

  const handlePasswordChange = () => {
    // TODO: Implement password change dialog
    alert("Şifre değiştirme özelliği yakında eklenecek");
  };

  return (
    <LoginView
      onLogin={handleLogin}
      onGuest={handleGuest}
      onPasswordChange={handlePasswordChange}
    />
  );
}


