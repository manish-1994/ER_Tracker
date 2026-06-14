import React, { FC, ReactNode } from "react";

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "default";
  onClick?: () => void;
}

export const CyberCard: FC<CyberCardProps> = ({ children, className = "", variant = "default", onClick }) => {
  const borderColors = {
    default: "border-cyan-500/20 shadow-[0_0_15px_rgba(0,0,0,0.5)]",
    primary: "border-primary/40 shadow-[0_0_15px_rgba(0,229,255,0.15)]",
    secondary: "border-secondary/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]",
    success: "border-success/40 shadow-[0_0_15px_rgba(0,255,157,0.15)]",
    warning: "border-warning/40 shadow-[0_0_15px_rgba(255,184,0,0.15)]",
    danger: "border-danger/40 shadow-[0_0_15px_rgba(255,77,109,0.15)]",
  }[variant];

  return (
    <div 
      className={`relative bg-cyberCard/90 backdrop-blur-lg border rounded-xl overflow-hidden p-6 transition-all duration-300 ${borderColors} ${className} ${onClick ? "cursor-pointer hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]" : ""}`}
      onClick={onClick}
      style={{ pointerEvents: "auto"}}
    >
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/40" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/40" />
      
      {children}
    </div>
  );
};
