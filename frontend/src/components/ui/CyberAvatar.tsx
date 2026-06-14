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
    sm: "w-8 h-8 text-xs border",
    md: "w-10 h-10 text-sm border-2",
    lg: "w-12 h-12 text-base border-2",
  }[size];

  // Neon gradient backgrounds based on username hashes to keep avatars distinct
  const hash = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorVariant = hash % 3;

  const bgStyles = [
    "bg-gradient-to-br from-cyan-950 to-black border-primary/60 text-primary shadow-[0_0_10px_rgba(0,229,255,0.25)]",
    "bg-gradient-to-br from-violet-950 to-black border-secondary/60 text-secondary shadow-[0_0_10px_rgba(139,92,246,0.25)]",
    "bg-gradient-to-br from-emerald-950 to-black border-success/60 text-success shadow-[0_0_10px_rgba(0,255,157,0.25)]",
  ][colorVariant];

  return (
    <div className="relative inline-block">
      <div 
        className={`flex items-center justify-center font-mono font-bold tracking-wider rounded-lg select-none ${sizeStyles} ${bgStyles} ${className}`}
      >
        {initials}
      </div>
      {isOnline && (
        <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-success ring-1 ring-black animate-pulse" />
      )}
    </div>
  );
};
