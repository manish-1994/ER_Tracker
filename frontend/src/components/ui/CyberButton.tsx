import React, { FC, ButtonHTMLAttributes } from "react";

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
}

export const CyberButton: FC<CyberButtonProps> = ({ 
  children, 
  className = "", 
  variant = "primary", 
  size = "md",
  disabled,
  ...rest 
}) => {
  const baseStyles = "relative font-mono uppercase font-bold tracking-wider rounded transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none border text-center cursor-pointer";
  
  const sizeStyles = {
    sm: "text-xs py-1 px-3",
    md: "text-sm py-2 px-5",
    lg: "text-base py-3 px-8",
  }[size];

  const variantStyles = {
    primary: "bg-black/45 border-primary text-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]",
    secondary: "bg-black/45 border-secondary text-secondary hover:bg-secondary/10 hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]",
    success: "bg-black/45 border-success text-success hover:bg-success/10 hover:shadow-[0_0_15px_rgba(0,255,157,0.4)]",
    warning: "bg-black/45 border-warning text-warning hover:bg-warning/10 hover:shadow-[0_0_15px_rgba(255,184,0,0.4)]",
    danger: "bg-black/45 border-danger text-danger hover:bg-danger/10 hover:shadow-[0_0_15px_rgba(255,77,109,0.4)]",
  }[variant];

  return (
    <button 
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`} 
      disabled={disabled}
      {...rest}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};
