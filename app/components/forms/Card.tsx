"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({
  children,
  className = "",
  padding = true,
}: CardProps) {
  return (
    <div
      className={`bg-surface-container border border-outline-variant rounded-lg ${
        padding ? "p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}







