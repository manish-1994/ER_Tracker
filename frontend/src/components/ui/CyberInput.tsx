import React, { FC, InputHTMLAttributes } from "react";

export const CyberInput: FC<InputHTMLAttributes<HTMLInputElement>> = ({ className = "", type, ...rest }) => {
  const base = type === "color" 
    ? "w-16 h-10 p-1 border border-secondary rounded-md cursor-pointer bg-[var(--surface)]"
    : "w-full bg-[var(--surface)] text-[var(--text)] border border-secondary rounded-md px-3 py-2 font-sans text-sm placeholder-secondary transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
  return <input className={`${base} ${className}`} type={type} {...rest} />;
};