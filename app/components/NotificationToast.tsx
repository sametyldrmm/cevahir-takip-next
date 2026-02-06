"use client";

import React, { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";
import { NotificationPayload } from "@/lib/websocket/notification-client";

interface NotificationToastProps {
  notification: NotificationPayload;
  onClose: () => void;
  duration?: number;
}

export function NotificationToast({
  notification,
  onClose,
  duration = 5000,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // Animasyon süresi
  };

  useEffect(() => {
    // Otomatik kapanma
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  // Bildirim tipine göre renk ve ikon
  const getNotificationStyle = () => {
    switch (notification.type) {
      case "morning-reminder":
        return {
          bgColor: "bg-gradient-to-r from-yellow-500 to-orange-500",
          icon: "🌅",
        };
      case "evening-reminder":
        return {
          bgColor: "bg-gradient-to-r from-purple-500 to-pink-500",
          icon: "🌆",
        };
      case "meeting-reminder":
        return {
          bgColor: "bg-gradient-to-r from-emerald-600 to-teal-600",
          icon: "⏰",
        };
      case "test":
        return {
          bgColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
          icon: "🧪",
        };
      default:
        return {
          bgColor: "bg-gradient-to-r from-gray-700 to-gray-800",
          icon: "🔔",
        };
    }
  };

  const style = getNotificationStyle();

  return (
    <div
      className={`
        relative
        min-w-[320px] max-w-[400px]
        rounded-lg shadow-2xl
        transform transition-all duration-300 ease-in-out
        ${isClosing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
        ${!isVisible ? "hidden" : ""}
        ${style.bgColor}
        text-white
        overflow-hidden
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{style.icon}</span>
            <h3 className="font-semibold text-sm">{notification.title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="
              text-white/80 hover:text-white
              transition-colors
              p-1 rounded-full hover:bg-white/20
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-white/90 leading-relaxed">
          {notification.message}
        </p>

        {/* Timestamp */}
        <p className="text-xs text-white/70 mt-2">
          {new Date(notification.timestamp).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/20 relative overflow-hidden">
        <div
          className="h-full bg-white/40 absolute top-0 left-0"
          style={{
            width: isClosing ? "0%" : "100%",
            transition: `width ${duration}ms linear`,
          }}
        />
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: NotificationPayload[];
  onRemove: (timestamp: string) => void;
}

export function NotificationContainer({
  notifications,
  onRemove,
}: NotificationContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {notifications.map((notification, index) => (
        <div
          key={`${notification.timestamp}-${index}`}
          className="relative"
          style={{
            zIndex: 50 - index,
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onRemove(notification.timestamp)}
            duration={5000}
          />
        </div>
      ))}
    </div>
  );
}
