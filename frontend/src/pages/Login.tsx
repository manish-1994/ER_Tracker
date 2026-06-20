import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberButton } from "../components/ui/CyberButton";

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await login(username, password);
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }
    } catch {
      setError("Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-text select-none relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--background)] pointer-events-none" />
      
      {/* Decorative glass orb */}
      <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-[var(--info)]/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[400px] h-[400px] rounded-full bg-[var(--border)]/6 blur-[80px] pointer-events-none" />

      <div className="flex flex-col lg:flex-row w-full relative z-10">
        {/* LEFT SIDE - Brand Panel */}
        <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between p-16">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-text tracking-tight">
              ER Tracker
            </h1>
            <p className="text-sm text-muted max-w-md leading-relaxed">
              Enterprise resource tracking and workbook management platform.
            </p>
          </div>

          <div className="space-y-6">
            {/* Feature highlights */}
            <div className="glass-panel-light rounded-xl p-6 max-w-md space-y-4">
              {[
                "Workbook Import & Management",
                "Role-Based Access Control",
                "Real-Time Collaboration",
                "Audit Trail & Compliance",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm text-text/80">{feature}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted">
              Enterprise Grade Platform &bull; Secured &bull; Compliant
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 min-h-screen">
          <motion.div
            className="relative glass-panel-strong border border-cyberBorder w-full max-w-md p-8 sm:p-10 rounded-[18px] shadow-glass-xl z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Mobile brand mark */}
            <div className="lg:hidden mb-8 text-center">
              <h1 className="text-2xl font-bold text-text">ER Tracker</h1>
              <p className="text-xs text-muted mt-1">Enterprise Resource Tracking</p>
            </div>

            {/* Heading */}
            <div className="mb-8 text-center">
              <h2 className="text-xl font-semibold text-text">
                Sign In
              </h2>
              <p className="text-sm text-muted mt-1">
                Enter your credentials to continue
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted" htmlFor="username">
                  Username
                </label>
                <CyberInput
                  id="username"
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <CyberInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted hover:text-text transition duration-200"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2.5 text-xs text-muted cursor-pointer hover:text-text transition select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-white/80 border border-cyberBorder text-primary focus:ring-primary/30 focus:ring-offset-0 transition cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {error && (
                <motion.div
                  className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 text-danger text-xs text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {error}
                </motion.div>
              )}

              <div className="pt-2">
                <CyberButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full py-3"
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </CyberButton>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;