import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-xl p-6 border border-gray-700 shadow-2xl"
  >
    {title && <h3 className="text-xl font-semibold mb-4 neon">{title}</h3>}
    {children}
  </motion.div>
);

export default Card;