"use client";

interface ThemeSectionProps {
  currentTheme: "light" | "dark" | "auto";
  currentAccent: "blue" | "orange" | "green";
  onThemeChange: (theme: "light" | "dark" | "auto") => void;
  onAccentChange: (accent: "blue" | "orange" | "green") => void;
  language: "tr" | "en";
  onLanguageChange: (lang: "tr" | "en") => void;
}

export default function ThemeSection({
  currentTheme,
  currentAccent,
  onThemeChange,
  onAccentChange,
  language,
  onLanguageChange,
}: ThemeSectionProps) {
  const themes = [
    { id: "auto" as const, label: "Sistem Teması", icon: "⚙️" },
    { id: "light" as const, label: "Açık Tema", icon: "☀️" },
    { id: "dark" as const, label: "Koyu Tema", icon: "🌙" },
  ];

  const accents = [
    { id: "blue" as const, label: "Mavi", color: "#2196F3" },
    { id: "orange" as const, label: "Turuncu", color: "#FF9800" },
    { id: "green" as const, label: "Yeşil", color: "#4CAF50" },
  ];

  return (
    <div className="bg-surface p-5 rounded-xl border border-outline-variant space-y-6">
      <div>
        <h3 className="text-xl font-bold text-on-surface mb-1">
          Tema Ayarları
        </h3>
        <p className="text-sm text-on-surface-variant">
          Tercih ettiğiniz arayüz görünümünü seçin.
        </p>
      </div>

      <div className="flex gap-6">
        {themes.map((theme) => {
          const isSelected = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                isSelected
                  ? "border-primary bg-primary-container"
                  : "border-outline-variant bg-surface-container-low hover:bg-surface-container-high"
              }`}
            >
              <div className="text-center">
                <span className="text-3xl mb-2 block">{theme.icon}</span>
                <span className="text-sm font-medium text-on-surface">
                  {theme.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-surface-container p-4 rounded-lg">
        <h4 className="text-base font-bold text-on-surface mb-1">
          Vurgu Rengi
        </h4>
        <p className="text-xs text-on-surface-variant mb-3">
          Butonlar ve vurgu öğeleri için renk seçin
        </p>
        <div className="flex gap-4">
          {accents.map((accent) => {
            const isSelected = currentAccent === accent.id;
            return (
              <button
                key={accent.id}
                onClick={() => onAccentChange(accent.id)}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  isSelected
                    ? "border-primary"
                    : "border-outline-variant hover:border-outline"
                }`}
              >
                <div
                  className="w-full h-12 rounded mb-2"
                  style={{ backgroundColor: accent.color }}
                />
                <span className="text-xs text-on-surface">{accent.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-surface-container p-4 rounded-lg">
        <h4 className="text-base font-bold text-on-surface mb-3">
          Dil Tercihi
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="language"
              value="tr"
              checked={language === "tr"}
              onChange={(e) => onLanguageChange(e.target.value as "tr" | "en")}
              className="text-primary"
            />
            <span className="text-on-surface">🇹🇷 Türkçe</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="language"
              value="en"
              checked={language === "en"}
              onChange={(e) => onLanguageChange(e.target.value as "tr" | "en")}
              className="text-primary"
            />
            <span className="text-on-surface">🇬🇧 English</span>
          </label>
        </div>
      </div>
    </div>
  );
}







