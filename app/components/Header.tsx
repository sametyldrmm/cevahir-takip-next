"use client";

// import { useAuth } from "@/app/contexts/AuthContext";
// import { useRouter } from "next/navigation";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  // const { logout } = useAuth();
  // const router = useRouter();

  // const handleLogout = () => {
  //   logout();
  //   router.push("/login");
  // };

  return (
    <header className="h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-(--surface-container-high) transition-colors text-on-surface"
          aria-label="Menüyü Aç/Kapat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <div className="w-4" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-10 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="text-primary text-lg font-bold">CPM</span>
          </div>
          <h1 className="text-xl font-semibold text-on-surface">Günlük Hedefler</h1>
        </div>
      </div>
      
      {/* <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 bg-error text-on-error rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
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
        <span>Çıkış</span>
      </button> */}
    </header>
  );
}
