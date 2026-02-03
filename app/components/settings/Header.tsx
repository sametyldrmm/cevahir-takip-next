"use client";

interface SettingsHeaderProps {
  currentTab: "general" | "account" | "theme";
  onTabChange: (tab: "general" | "account" | "theme") => void;
}

export default function SettingsHeader({
  currentTab,
  onTabChange,
}: SettingsHeaderProps) {
  const tabs = [
    { id: "general" as const, label: "Genel" },
    { id: "account" as const, label: "Hesap" },
    { id: "theme" as const, label: "Tema" },
  ];

  return (
    <div className="bg-surface-container border-b border-outline-variant px-6 py-4">
      <h2 className="text-2xl font-bold text-on-surface mb-4">Ayarlar</h2>
      <div className="flex gap-4 border-b border-outline-variant">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              currentTab === tab.id
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}









