import React, { FC, InputHTMLAttributes } from "react";

export const CyberInput: FC<InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...rest }) => {
  const base = "w-full bg-[#0a0f1d]/85 text-text border border-cyan-500/30 rounded-lg px-4 py-2.5 font-mono text-sm placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,229,255,0.25)] focus:bg-[#070b14]/95";
  return <input className={`${base} ${className}`} {...rest} />;
};
