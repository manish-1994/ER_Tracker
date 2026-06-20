import React, { FC, SelectHTMLAttributes, useState, useMemo } from "react";

interface SelectOption {
  value: string;
  label: string;
  subtext?: string;
}

interface CyberSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  placeholder?: string;
  options: SelectOption[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
}

export const CyberSelect: FC<CyberSelectProps> = ({
  placeholder = "Select...",
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  ...rest
}) => {
  const [search, setSearch] = useState("");
  
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(opt =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.subtext && opt.subtext.toLowerCase().includes(search.toLowerCase()))
    );
  }, [options, search]);
  
return (
    <div className="space-y-1">
      {options.length > 0 && (
        <input
          type="text"
          placeholder={`Search ${placeholder.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
          className="w-full bg-[var(--surface)] text-[var(--text)] border border-secondary rounded-md px-3 py-2 font-sans text-sm placeholder-secondary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 mb-1"
        />
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full bg-[var(--surface)] text-[var(--text)] border border-secondary rounded-md px-3 py-2 font-sans text-sm transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 ${className}`}
        {...rest}
      >
        <option value="" disabled>{options.length === 0 ? "No users available" : placeholder}</option>
        {filteredOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}{opt.subtext ? ` (${opt.subtext})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
};