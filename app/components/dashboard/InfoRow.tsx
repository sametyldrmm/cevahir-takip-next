"use client";

interface InfoRowProps {
  icon: string;
  label: string;
  value: string | React.ReactNode;
  labelWidth?: string;
}

export default function InfoRow({
  icon,
  label,
  value,
  labelWidth = "w-24",
}: InfoRowProps) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-sm text-on-surface w-5">{icon}</span>
      <span className={`text-sm font-medium text-on-surface ${labelWidth}`}>
        {label}:
      </span>
      <div className="flex-1 text-sm text-on-surface-variant">
        {typeof value === "string" ? value : value}
      </div>
    </div>
  );
}







