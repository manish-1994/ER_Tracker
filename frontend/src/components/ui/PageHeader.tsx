import React, { FC, ReactNode } from "react";

/** Simple page header with title and optional subtitle */
export const PageHeader: FC<{ title: string; subtitle?: string; className?: string }> = ({ title, subtitle, className }) => {
  return (
    <header className={`mb-6 ${className || ""}`}>
      <h1 className="text-4xl font-extrabold text-[#00E5FF]" style={{ textShadow: "0 0 15px rgba(0,229,255,0.5)" }}>{title}</h1>
      {subtitle && <p className="text-lg text-[#94A3B8] mt-2">{subtitle}</p>}
    </header>
  );
};
