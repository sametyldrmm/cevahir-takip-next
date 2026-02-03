"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
} from "react";
import toast, {
  ToastOptions,
  Toaster,
} from "react-hot-toast";

type NotificationContextType = {
  showSuccess: (message: string, options?: ToastOptions) => void;
  showError: (message: string, options?: ToastOptions) => void;
  showWarning: (message: string, options?: ToastOptions) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const showSuccess = (message: string, options?: ToastOptions) =>
    toast.success(message, options);

  const showError = (message: string, options?: ToastOptions) =>
    toast.error(message, options);

  const showWarning = (message: string, options?: ToastOptions) =>
    toast(message, {
      ...options,
      icon: "⚠️",
    });

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
      }}
    >
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification NotificationProvider içinde kullanılmalı");
  }
  return ctx;
}









