import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/appConfig";
import { ENDPOINTS } from "../config/endpoints";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

/** Cyber‑punk styled login screen */
const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Verify backend health on component mount
  useEffect(() => {
    // Construct health URL by removing any trailing '/api' from base URL
    const base = API_BASE_URL.replace(/\/api$/, "");
    const healthUrl = `${base}${ENDPOINTS.HEALTH}`;
    console.log("Health Check URL:", healthUrl);
    console.log("Health Check Status:");
    fetch(healthUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Health check failed");
      })
      .catch(() => setBackendAvailable(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("LOGIN REQUEST");
    console.log("USERNAME:", username);
    console.log("API URL:", import.meta.env.VITE_API_BASE_URL);
    try {
      const response = await login(username, password);
      console.log("LOGIN RESPONSE:", response);
    } catch (err: any) {
      console.log("LOGIN ERROR RESPONSE:", err.response?.data);
      console.log("LOGIN ERROR STATUS:", err.response?.status);
      setError("Invalid credentials");
    }
  };

  if (!backendAvailable) {
    return <p className="text-center text-red-500">Backend unavailable. Please start FastAPI server.</p>;
  }
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 pr-10 bg-gray-800 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 hover:text-cyan-400"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
