import React, { FC, ReactNode } from "react";

/** Simple page header with title and optional subtitle */
export const PageHeader: FC<{ title: string; subtitle?: string; className?: string }> = ({ title, subtitle, className }) => {
  return (
    <header className={`mb-6 ${className || ""}`}>
      <h1 className="text-3xl font-bold text-text tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
    </header>
  );
};
