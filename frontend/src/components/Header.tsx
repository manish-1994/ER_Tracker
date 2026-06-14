import React from "react";
import { useAuth } from "../context/AuthContext";
import { CyberAvatar } from "./ui/CyberAvatar";

const Header: React.FC = () => {
  const { appUser } = useAuth();
  const username = appUser?.username || "Unknown";

  return (
    <header className="h-16 px-8 flex items-center justify-end bg-[#050b14]/75 backdrop-blur-md border-b border-cyan-500/20 sticky top-0 z-30 font-mono">
      <div className="flex items-center gap-3 bg-[#0a0f1d]/60 border border-cyan-500/10 px-4 py-1.5 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
        <CyberAvatar username={username} size="sm" isOnline={true} />
        <span className="text-primary font-bold uppercase tracking-widest text-xs neon-text-primary">
          {username}
        </span>
      </div>
    </header>
  );
};

export default Header;