import React, { FC, ReactNode } from "react";

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
    <div className={`relative flex flex-col justify-between overflow-hidden glass-panel rounded-lg shadow-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-secondary">
          {title}
        </span>
        {icon && (
          <div className={`text-base opacity-80 ${accentColors}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mb-2">
        <h3 className="text-2xl font-sans font-bold tracking-tight text-textPrimary">
          {value}
        </h3>
      </div>
      {(trend || subtitle) && (
        <div className="flex items-center justify-between text-[10px] font-sans">
          {subtitle && <span className="text-secondary">{subtitle}</span>}
          {trend && (
            <span className={`ml-auto font-bold ${trend.isPositive ? "text-success" : "text-danger"}`}>
              {trend.isPositive ? "▲" : "▼"} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};