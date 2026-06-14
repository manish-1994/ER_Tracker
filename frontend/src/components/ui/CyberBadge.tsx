import React, { FC, ReactNode } from "react";

interface CyberBadgeProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "muted";
  className?: string;
}

export const CyberBadge: FC<CyberBadgeProps> = ({ children, variant = "success", className = "" }) => {
  const style = {
    primary: "bg-primary/10 border border-primary/40 text-primary shadow-[0_0_8px_rgba(0,229,255,0.2)]",
    secondary: "bg-secondary/10 border border-secondary/40 text-secondary shadow-[0_0_8px_rgba(139,92,246,0.2)]",
    success: "bg-success/10 border border-success/40 text-success shadow-[0_0_8px_rgba(0,255,157,0.2)]",
    warning: "bg-warning/10 border border-warning/40 text-warning shadow-[0_0_8px_rgba(255,184,0,0.2)]",
    danger: "bg-danger/10 border border-danger/40 text-danger shadow-[0_0_8px_rgba(255,77,109,0.2)]",
    muted: "bg-gray-500/10 border border-gray-500/40 text-gray-400",
  }[variant];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono uppercase font-semibold tracking-wider ${style} ${className}`}>
      {children}
    </span>
  );
};
