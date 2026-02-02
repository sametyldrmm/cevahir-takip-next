"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

interface SidebarProps {
  currentView: string;
  isAdmin: boolean;
  currentUser: string;
  onNavigate: (viewId: string) => void;
  collapsed?: boolean;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "target_form", label: "Hedef Girişi", icon: "document" },
  { id: "team_tracking", label: "Takım Takibi", icon: "group" },
  { id: "reports", label: "Raporlama", icon: "chart" },
  { id: "permission_requests", label: "İzin İstekleri", icon: "request" },
];

// SVG Icon Components
const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const GroupIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AdminIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RequestIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PersonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const getIcon = (iconName: string, className: string = "w-5 h-5") => {
  switch (iconName) {
    case "grid":
      return <GridIcon className={className} />;
    case "document":
      return <DocumentIcon className={className} />;
    case "group":
      return <GroupIcon className={className} />;
    case "chart":
      return <ChartIcon className={className} />;
    case "settings":
      return <SettingsIcon className={className} />;
    case "admin":
      return <AdminIcon className={className} />;
    case "request":
      return <RequestIcon className={className} />;
    default:
      return null;
  }
};

export default function Sidebar({
  currentView,
  isAdmin,
  currentUser,
  onNavigate,
  collapsed = false,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNavigate = (viewId: string) => {
    const routeMap: Record<string, string> = {
      dashboard: "/dashboard",
      target_form: "/target-form",
      team_tracking: "/team-tracking",
      reports: "/reports",
      permission_requests: "/permission-requests",
      admin_panel: "/admin-panel",
      settings: "/settings",
    };
    const route = routeMap[viewId] || "/dashboard";
    router.push(route);
    onNavigate(viewId);
  };

  const formatUserName = (username: string) => {
    const userNames: Record<string, string> = {
      "berk.cam": "Berk Cam",
      "melike": "Melike Çatak",
      "melike.catak": "Melike Çatak",
      "cansu": "Cansu Tüfekci",
      "cansu.tufekci": "Cansu Tüfekci",
      "enes.tunc": "Enes Tunç",
      "erman.ayaz": "Erman Ayaz",
      "guest": "Misafir Kullanıcı",
    };

    if (username in userNames) {
      return userNames[username];
    }

    return username.replace(/[._]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const displayName = user?.displayName || formatUserName(currentUser);
  const userRole = isAdmin ? "Admin" : "Kullanıcı";

  const allNavItems = isAdmin
    ? [...navItems, { id: "admin_panel", label: "Admin Panel", icon: "admin" }]
    : navItems;

  if (collapsed) {
    return (
      <div className="w-16 bg-surface-container border-r border-outline-variant flex flex-col items-center py-4 gap-3 min-h-full">
        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
          <PersonIcon className="w-6 h-6" />
        </div>
        <div className="w-10 h-px bg-outline-variant" />
        {allNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
              currentView === item.id
                ? "bg-primary-container border-2 border-primary text-primary"
                : "hover:bg-surface-container-high text-on-surface-variant"
            }`}
            title={item.label}
          >
            {getIcon(item.icon)}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => handleNavigate("settings")}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
            currentView === "settings"
              ? "bg-primary-container border-2 border-primary text-primary"
              : "hover:bg-surface-container-high text-on-surface-variant"
          }`}
          title="Ayarlar"
        >
          {getIcon("settings")}
        </button>
        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-lg flex items-center justify-center transition-all hover:bg-error-container text-error"
          title="Çıkış Yap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-surface-container border-r border-outline-variant flex flex-col min-h-full">
      {/* User Section */}
      <div className="p-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary">
            <PersonIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">
              {displayName}
            </p>
            <p className="text-xs text-on-surface-variant truncate">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-2">
        {allNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
              currentView === item.id
                ? "bg-primary-container border-r-4 border-primary text-primary font-medium"
                : "hover:bg-surface-container-high text-on-surface"
            }`}
          >
            {getIcon(item.icon, "w-5 h-5")}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="border-t border-outline-variant p-2 space-y-2">
        <button
          onClick={() => handleNavigate("settings")}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all ${
            currentView === "settings"
              ? "bg-primary-container border-2 border-primary text-primary font-medium"
              : "hover:bg-surface-container-high text-on-surface"
          }`}
        >
          {getIcon("settings", "w-5 h-5")}
          <span className="text-sm">Ayarlar</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all hover:bg-error-container text-error hover:text-on-error"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="text-sm">Çıkış Yap</span>
        </button>
        <div className="px-4 py-2 mt-2">
          <p className="text-xs text-on-surface-variant text-center">
            CPM - Günlük Hedefler v2.1.0
          </p>
        </div>
      </div>
    </div>
  );
}
