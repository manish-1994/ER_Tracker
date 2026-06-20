import React, { FC, ReactNode } from "react";

interface CyberBadgeProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "muted";
  className?: string;
}

export const CyberBadge: FC<CyberBadgeProps> = ({ children, variant = "success", className = "" }) => {
  const style = {
    primary: "bg-primary/10 border border-primary/30 text-primary",
    secondary: "bg-secondary/10 border border-secondary/30 text-secondary",
    success: "bg-success/10 border border-success/20 text-success",
    warning: "bg-warning/10 border border-warning/20 text-warning",
    danger: "bg-danger/10 border border-danger/20 text-danger",
    muted: "bg-secondary/10 border border-secondary/20 text-secondary",
  }[variant];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-sans font-medium ${style} ${className}`}>
      {children}
    </span>
  );
};