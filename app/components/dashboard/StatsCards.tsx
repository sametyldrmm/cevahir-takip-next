"use client";

interface StatsCardsProps {
  stats: {
    totalTargets: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  onCardClick?: (filter: "all" | "completed" | "inProgress" | "pending") => void;
}

export default function StatsCards({ stats, onCardClick }: StatsCardsProps) {
  const cards = [
    {
      title: "Toplam Girilen Hedef",
      value: stats.totalTargets,
      color: "text-primary",
      bgColor: "bg-primary-container",
      borderColor: "border-primary/30",
      icon: "📊",
      filter: "all" as const,
    },
    {
      title: "Başarıyla Tamamlanan",
      value: stats.completed,
      color: "text-success",
      bgColor: "bg-success-container",
      borderColor: "border-success/30",
      icon: "✅",
      filter: "completed" as const,
    },
    {
      title: "Kısmen Tamamlanan",
      value: stats.inProgress,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
      icon: "⏳",
      filter: "inProgress" as const,
    },
    {
      title: "Ulaşılamayan Hedef",
      value: stats.pending,
      color: "text-error",
      bgColor: "bg-error-container",
      borderColor: "border-error/30",
      icon: "❌",
      filter: "pending" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          onClick={() => onCardClick?.(card.filter)}
          className={`${card.bgColor} p-6 rounded-xl border-2 ${card.borderColor} shadow-sm hover:shadow-md transition-all ${
            onCardClick ? "cursor-pointer hover:scale-105" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">{card.icon}</span>
            <span className={`text-4xl font-bold ${card.color}`}>
              {card.value}
            </span>
          </div>
          <h3 className="text-sm font-medium text-on-surface-variant">
            {card.title}
          </h3>
        </div>
      ))}
    </div>
  );
}
