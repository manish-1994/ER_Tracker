import React, { FC, ReactNode } from "react";
import { CyberCard } from "./CyberCard";

interface CyberStatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const CyberStatCard: FC<CyberStatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  variant = "default",
  trend,
  className = ""
}) => {
  const accentColors = {
    default: "text-primary",
    primary: "text-primary",
    secondary: "text-secondary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[variant];

  return (
    <CyberCard variant={variant} className={`relative flex flex-col justify-between overflow-hidden ${className}`}>
      {/* Top row with title and icon */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase font-mono tracking-widest text-muted">
          {title}
        </span>
        {icon && (
          <div className={`text-lg opacity-85 ${accentColors}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Main value display */}
      <div className="mb-2">
        <h3 className={`text-3xl font-mono font-bold tracking-tight ${accentColors} neon-text-primary`}>
          {value}
        </h3>
      </div>

      {/* Trend or Subtitle */}
      {(trend || subtitle) && (
        <div className="flex items-center justify-between text-xs font-mono">
          {subtitle && <span className="text-gray-500">{subtitle}</span>}
          {trend && (
            <span className={`ml-auto font-bold ${trend.isPositive ? "text-success" : "text-danger"}`}>
              {trend.isPositive ? "▲" : "▼"} {trend.value}
            </span>
          )}
        </div>
      )}

      {/* Decorative scanning line animation */}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse" />
    </CyberCard>
  );
};
