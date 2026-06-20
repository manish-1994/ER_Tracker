import React, { FC } from "react";

interface CyberAvatarProps {
  username?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  isOnline?: boolean;
}

export const CyberAvatar: FC<CyberAvatarProps> = ({ 
  username = "??", 
  size = "md", 
  className = "",
  isOnline = true
}) => {
  const initials = username.slice(0, 2).toUpperCase();

  const sizeStyles = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }[size];

  const hash = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorVariant = hash % 3;

  const bgStyles = [
    "bg-primary/10 border-primary/30 text-primary",
    "bg-secondary/15 border-secondary/30 text-textPrimary",
    "bg-accent/10 border-accent/30 text-accent",
  ][colorVariant];

  return (
    <div className="relative inline-block">
      <div 
        className={`flex items-center justify-center font-sans font-semibold tracking-wider rounded-md select-none border ${sizeStyles} ${bgStyles} ${className}`}
      >
        {initials}
      </div>
      {isOnline && (
        <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-success ring-2 ring-white" />
      )}
    </div>
  );
};