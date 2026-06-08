import React from "react";
import { motion } from "framer-motion";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export const Button: React.FC<ButtonProps> = ({ children, variant = "primary", className = "", ...rest }) => {
  const base = "px-4 py-2 rounded-md font-medium transition-all shadow-md";
  const variantClass =
    variant === "primary"
      ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:scale-105"
      : "bg-gray-700 text-gray-200 hover:scale-105";
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={`${base} ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

export default Button;