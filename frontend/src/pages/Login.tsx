import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

/** Cyber‑punk styled login screen */
const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070B14] to-[#0a0f1a]">
      <motion.div
        className="bg-black/70 backdrop-blur-lg p-8 rounded-lg shadow-2xl border border-cyan-500/30 w-full max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-center text-cyan-400 mb-6 drop-shadow-[0_0_6px_#00ffff]">
          ER Login
        </h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 mb-2 text-center">{error}</p>}
          <motion.button
            type="submit"
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded shadow-lg hover:shadow-xl transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>
        </form>
      </motion.div>
    </section>
  );
};

export default Login;
