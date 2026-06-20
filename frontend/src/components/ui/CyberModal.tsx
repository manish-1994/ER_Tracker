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
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative glass-panel-strong rounded-lg max-w-lg w-full max-h-[calc(100vh-2rem)] flex flex-col p-6 shadow-glass-lg z-10 overflow-hidden font-sans"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-secondary/20 flex-shrink-0">
              {title && (
                <h2 className="text-lg font-semibold text-textPrimary tracking-tight">
                  {title}
                </h2>
              )}
              <button 
                onClick={onClose}
                className="text-secondary hover:text-danger text-lg px-2 rounded transition-all"
              >
                ✕
              </button>
            </div>
            <div className="text-textPrimary flex-1 overflow-y-auto min-h-0 pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};