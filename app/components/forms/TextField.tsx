"use client";

interface TextFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password" | "email" | "number";
  error?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
}

export default function TextField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  required = false,
  multiline = false,
  rows = 3,
  maxLength,
  disabled = false,
}: TextFieldProps) {
  const baseClasses = `w-full px-3 py-2 bg-surface border rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary ${
    error ? "border-red-500" : "border-outline"
  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-on-surface mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          className={baseClasses + " resize-none"}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={baseClasses}
        />
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}







