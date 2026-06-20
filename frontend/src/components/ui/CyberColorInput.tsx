import React, { FC, InputHTMLAttributes, useState } from "react";

interface CyberColorInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const CyberColorInput: FC<CyberColorInputProps> = ({ 
  value, 
  onChange, 
  label,
  className = "" 
}) => {
  const [hexValue, setHexValue] = useState(value || "");

  const validateAndFormatHex = (hex: string): string => {
    let cleaned = hex.trim().toUpperCase();
    if (!cleaned.startsWith("#")) {
      cleaned = "#" + cleaned;
    }
    const valid = /^#[0-9A-F]{6}$/i.test(cleaned);
    return valid ? cleaned : "";
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setHexValue(inputValue);
    const formatted = validateAndFormatHex(inputValue);
    if (formatted) {
      onChange(formatted);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickerValue = e.target.value;
    setHexValue(pickerValue);
    onChange(pickerValue);
  };

  return (
    <div className={className}>
      {label && <label className="text-xs text-secondary">{label}</label>}
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || "#FFFFFF"}
          onChange={handlePickerChange}
          className="w-10 h-10 p-1 border border-secondary rounded-md cursor-pointer bg-white"
        />
<input
           type="text"
           value={hexValue}
           onChange={handleTextChange}
           placeholder="#FFFFFF"
           className="flex-1 bg-[var(--surface)] text-[var(--text)] border border-secondary rounded-md px-2 py-1 font-mono text-sm focus:outline-none focus:border-primary"
         />
      </div>
    </div>
  );
};