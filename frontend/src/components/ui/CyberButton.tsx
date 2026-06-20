import React, { FC, ButtonHTMLAttributes } from "react";

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
}

export const PremiumButton: FC<PremiumButtonProps> = ({ 
  children, 
  className = "", 
  variant = "primary", 
  size = "md",
  disabled,
  ...rest 
}) => {
  const baseStyles = "relative font-sans font-semibold rounded-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border text-center cursor-pointer";
  
  const sizeStyles = {
    sm: "text-xs py-1 px-2.5",
    md: "text-sm py-1.5 px-4",
    lg: "text-base py-2 px-6",
  }[size];

  const variantStyles = {
    primary: "bg-primary text-textPrimary border-primary hover:bg-accent",
    secondary: "bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20",
    success: "bg-success/10 text-success border-success/30 hover:bg-success/20",
    warning: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20",
    danger: "bg-danger/10 text-danger border-danger/30 hover:bg-danger/20",
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

export const CyberButton = PremiumButton;