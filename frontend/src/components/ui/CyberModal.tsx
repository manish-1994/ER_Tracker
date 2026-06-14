import React, { FC, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CyberModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export const CyberModal: FC<CyberModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop Overlay */}
          <motion.div
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <motion.div
            className="relative bg-cyberCard border border-primary/45 rounded-xl max-w-lg w-full max-h-[calc(100vh-2rem)] flex flex-col p-6 shadow-[0_0_30px_rgba(0,229,255,0.2)] z-10 overflow-hidden font-mono"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Techy Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-cyan-500/25 flex-shrink-0">
              {title && (
                <h2 className="text-xl font-bold uppercase text-primary tracking-wider neon-text-primary">
                  {title}
                </h2>
              )}
              <button 
                onClick={onClose}
                className="text-muted hover:text-danger hover:shadow-[0_0_8px_rgba(255,77,109,0.5)] font-bold text-lg px-2 rounded transition-all"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="text-text flex-1 overflow-y-auto min-h-0 pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
