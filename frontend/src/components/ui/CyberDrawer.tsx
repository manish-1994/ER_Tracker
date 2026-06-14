import React, { FC, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CyberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
}

export const CyberDrawer: FC<CyberDrawerProps> = ({ isOpen, onClose, title, children, width = "w-full md:w-[600px]" }) => {
  // Ensure the width class is responsive: w-full on mobile, and specific width on md+ screens
  const responsiveWidth = width.includes("w-")
    ? (width.includes("md:") || width.includes("sm:") ? width : `w-full md:${width}`)
    : "w-full md:w-[600px]";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer Panel */}
          <motion.div
            className={`fixed top-0 right-0 h-full ${responsiveWidth} bg-[#0F172A] border-l border-primary/40 z-50 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col font-mono`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Techy Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-cyan-500/25 px-6 pt-6">
              {title && (
                <h2 className="text-xl font-bold uppercase text-primary tracking-wider neon-text-primary">
                  {title}
                </h2>
              )}
              <button 
                onClick={onClose}
                className="text-muted hover:text-danger hover:shadow-[0_0_8px_rgba(255,77,109,0.5)] font-bold text-lg px-2 rounded transition-all ml-auto"
              >
                ✕
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 text-text">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};