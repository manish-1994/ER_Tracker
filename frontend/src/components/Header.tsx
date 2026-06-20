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
    <header className="h-16 px-6 md:px-8 flex items-center justify-between glass-panel border-b border-secondary/20 sticky top-0 z-30 font-sans">
      {onMenuToggle ? (
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 border border-secondary/20 rounded-md bg-[var(--surface)]/80 text-textSecondary hover:text-textPrimary"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      ) : (
        <div className="md:hidden" />
      )}

      <div className="flex items-center gap-3 glass-panel-light px-4 py-1.5 rounded-md ml-auto">
        <CyberAvatar username={username} size="sm" isOnline={true} />
        <span className="text-textPrimary font-semibold text-xs">
          {username}
        </span>
      </div>
    </header>
  );
};

export default Header;