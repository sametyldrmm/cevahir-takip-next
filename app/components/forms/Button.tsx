"use client";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "text";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  fullWidth = false,
  icon,
}: ButtonProps) {
  const baseClasses = `px-4 py-2 rounded-lg font-medium transition-opacity ${
    fullWidth ? "w-full" : ""
  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  const variantClasses = {
    primary: "bg-primary text-on-primary hover:opacity-90",
    secondary: "bg-surface-container text-on-surface hover:bg-surface-container-high",
    danger: "bg-red-600 text-white hover:bg-red-700",
    text: "text-on-surface-variant hover:text-on-surface",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <div className="flex items-center justify-center gap-2">
        {icon}
        {children}
      </div>
    </button>
  );
}









