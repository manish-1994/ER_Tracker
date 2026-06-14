import React from "react";
import { useAuth } from "../context/AuthContext";
import { CyberAvatar } from "./ui/CyberAvatar";
import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { appUser } = useAuth();
  const username = appUser?.username || "Unknown";

  return (
    <header className="h-16 px-6 md:px-8 flex items-center justify-between bg-[#050b14]/75 backdrop-blur-md border-b border-cyan-500/20 sticky top-0 z-30 font-mono">
      {onMenuToggle ? (
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 border border-cyan-500/20 rounded bg-[#0a0f1d]/60 text-primary hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      ) : (
        <div className="md:hidden" />
      )}

      <div className="flex items-center gap-3 bg-[#0a0f1d]/60 border border-cyan-500/10 px-4 py-1.5 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] ml-auto">
        <CyberAvatar username={username} size="sm" isOnline={true} />
        <span className="text-primary font-bold uppercase tracking-widest text-xs neon-text-primary font-mono">
          {username}
        </span>
      </div>
    </header>
  );
};

export default Header;