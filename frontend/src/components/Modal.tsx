import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-70" onClick={onClose} />
        <motion.div
          className="bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-lg p-6 max-w-lg w-full z-10 border border-gray-600"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          {title && <h2 className="text-2xl font-bold mb-4 neon">{title}</h2>}
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Modal;