"use client";

interface EmptyStatesProps {
  type: "target" | "projects" | "users" | "team";
  date?: string;
  message?: string;
}

export default function EmptyStates({
  type,
  date,
  message,
}: EmptyStatesProps) {
  const getContent = () => {
    switch (type) {
      case "target":
        return {
          icon: "📝",
          title: date ? `${date} Hedefi` : "Hedef Bulunamadı",
          message:
            message ||
            "Hedef girişi yapmak için sol menüden 'Hedef Girişi' seçeneğini kullanabilirsiniz.",
        };
      case "projects":
        return {
          icon: "📁",
          title: "Proje Bulunamadı",
          message: "Henüz proje eklenmemiş.",
        };
      case "users":
        return {
          icon: "👤",
          title: "Kullanıcı Bulunamadı",
          message: "Henüz kullanıcı eklenmemiş.",
        };
      case "team":
        return {
          icon: "👥",
          title: "Takım Üyesi Bulunamadı",
          message: "Bu projede çalışan başka takım üyesi yok.",
        };
      default:
        return {
          icon: "📭",
          title: "Veri Bulunamadı",
          message: "Henüz veri eklenmemiş.",
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <span className="text-6xl mb-4">{content.icon}</span>
      <h3 className="text-lg font-semibold text-on-surface mb-2">
        {content.title}
      </h3>
      <p className="text-sm text-on-surface-variant text-center max-w-md">
        {content.message}
      </p>
    </div>
  );
}







