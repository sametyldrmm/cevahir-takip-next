"use client";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function Dropdown({
  label,
  value,
  options,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
}: DropdownProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-on-surface mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-surface border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? "border-red-500" : "border-outline"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}







