"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "../contexts/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const getCurrentView = () => {
    if (pathname?.startsWith("/dashboard")) return "dashboard";
    if (pathname?.startsWith("/target-form")) return "target_form";
    if (pathname?.startsWith("/team-tracking")) return "team_tracking";
    if (pathname?.startsWith("/reports")) return "reports";
    if (pathname?.startsWith("/permission-requests")) return "permission_requests";
    if (pathname?.startsWith("/admin-panel")) return "admin_panel";
    if (pathname?.startsWith("/settings")) return "settings";
    return "dashboard";
  };

  const handleNavigate = (viewId: string) => {
    // Navigation handled by Sidebar component
  };

  const isAdmin = user?.role === "ADMIN";
  const currentUser = user?.username || "";

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentView={getCurrentView()}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
