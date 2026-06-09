import React from "react";

/**
 * Header component according to the design spec.
 * Left side – page title (will be supplied via children or context later).
 * Right side – search box, user avatar placeholder, role badge.
 * Uses the defined color system and glass effect.
 */
const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center h-16 px-6 bg-[#0B1220] bg-opacity-90 backdrop-blur-md">
      {/* Left – page title */}
      <h1 className="text-36 font-bold text-[#F8FAFC]">Dashboard</h1>
      {/* Right – controls */}
      <div className="flex items-center space-x-4">
        {/* Search box */}
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-1 rounded bg-white bg-opacity-10 backdrop-blur-sm text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none"
        />
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-[#22D3EE]" />
        {/* Role badge */}
        <span className="px-2 py-0.5 bg-[#06B6D4] text-[#F8FAFC] text-sm rounded">
          SuperAdmin
        </span>
      </div>
    </header>
  );
};

export default Header;