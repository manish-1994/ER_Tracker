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
  const responsiveWidth = width.includes("w-")
    ? (width.includes("md:") || width.includes("sm:") ? width : `w-full md:${width}`)
    : "w-full md:w-[600px]";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer Panel */}
          <motion.div
            className={`fixed top-0 right-0 h-full ${responsiveWidth} glass-panel-strong border-l border-secondary/20 z-50 shadow-glass-lg overflow-hidden flex flex-col font-sans`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-secondary/20 px-6 pt-6">
              {title && (
                <h2 className="text-xl font-semibold text-textPrimary tracking-tight">
                  {title}
                </h2>
              )}
              <button 
                onClick={onClose}
                className="text-textSecondary hover:text-danger font-bold text-lg px-2 rounded transition-all ml-auto"
              >
                ✕
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 text-textPrimary">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};