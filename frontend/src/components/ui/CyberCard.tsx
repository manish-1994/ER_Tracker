import React, { FC, ReactNode } from "react";

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
  onClick?: () => void;
}

export const PremiumCard: FC<PremiumCardProps> = ({ children, className = "", variant = "default", onClick }) => {
  const variantStyles = {
    default: "border-secondary/20",
    primary: "border-primary/50",
    secondary: "border-secondary/40",
    success: "border-success/30",
    warning: "border-warning/30",
    danger: "border-danger/30",
  }[variant];

  return (
    <div 
      className={`relative glass-panel-strong rounded-lg overflow-hidden p-6 transition-all duration-200 shadow-lg hover:shadow-xl ${variantStyles} ${className} ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Keep CyberCard as alias for backward compatibility
export const CyberCard = PremiumCard;