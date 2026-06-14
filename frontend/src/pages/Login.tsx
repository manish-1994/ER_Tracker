import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberButton } from "../components/ui/CyberButton";

/** Canvas particle effect component */
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.8,
        color: i % 3 === 0 ? "rgba(139, 92, 246, 0.25)" : "rgba(0, 229, 255, 0.25)",
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off bounds
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Telemetry simulation states
  const [latency, setLatency] = useState(14);
  const [load, setLoad] = useState(1.82);

// Load remembered username on mount
   useEffect(() => {
     const savedUsername = localStorage.getItem("rememberedUsername");
     if (savedUsername) {
       setUsername(savedUsername);
       setRememberMe(true);
     }
   }, []);

   // Simulated telemetry ticker
   useEffect(() => {
     const timer = setInterval(() => {
       setLatency(Math.floor(Math.random() * 6) + 12);
       setLoad(parseFloat((Math.random() * 0.3 + 1.6).toFixed(2)));
     }, 4000);
     return () => clearInterval(timer);
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#020617] text-[#E2E8F0] select-none font-mono relative overflow-hidden">
      {/* Global CSS styles for animated grid and special glows */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes grid-scroll-anim {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        .cyber-grid-overlay {
          background: radial-gradient(circle at 60% 50%, rgba(2, 6, 23, 0) 10%, #020617 90%);
        }
        .neon-glow-card {
          box-shadow: 0 0 25px rgba(0, 229, 255, 0.05), inset 0 0 15px rgba(0, 229, 255, 0.02);
        }
        .neon-glow-card:focus-within {
          box-shadow: 0 0 35px rgba(0, 229, 255, 0.12), inset 0 0 20px rgba(0, 229, 255, 0.04);
        }
        .neon-text-glow {
          text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
        }
        .neon-text-glow-purple {
          text-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
        }
      `}} />

      {/* LEFT SIDE (60%) - Operative telemetry & visualization panel */}
      <div className="relative hidden lg:flex lg:w-[60%] flex-col justify-between p-16 border-r border-[#00E5FF]/10 overflow-hidden bg-[#01040a]">
        {/* Animated Cyber Grid background with 3D perspective projection */}
        <div className="absolute inset-0 overflow-hidden opacity-35 z-0 pointer-events-none">
          <div 
            className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 229, 255, 0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 229, 255, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              transform: 'perspective(450px) rotateX(65deg)',
              animation: 'grid-scroll-anim 12s linear infinite',
            }}
          />
          <div className="absolute inset-0 cyber-grid-overlay" />
        </div>

        {/* Dynamic floating particle network */}
        <ParticleBackground />

        {/* Header Branding */}
        <div className="z-10 flex flex-col space-y-1.5">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 bg-[#00E5FF] rounded-none animate-pulse shadow-[0_0_8px_#00E5FF]" />
            <h1 className="text-4xl font-extrabold tracking-[0.25em] text-[#00E5FF] neon-text-glow font-mono">
              ER TRACKER
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] tracking-[0.2em] uppercase font-mono pl-6">
            Enterprise Resource Tracking System
          </p>
        </div>

        {/* Central Spinning HUD and Hologram Display */}
        <div className="relative w-80 h-80 flex items-center justify-center mx-auto my-auto z-10 select-none">
          {/* Concentric rotating elements */}
          <div className="absolute w-full h-full border border-dashed border-[#00E5FF]/20 rounded-full animate-[spin_50s_linear_infinite]" />
          <div className="absolute w-[86%] h-[86%] border border-dotted border-[#8B5CF6]/35 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
          <div className="absolute w-[70%] h-[70%] border border-[#00E5FF]/15 rounded-full flex items-center justify-center">
            {/* Center pulsing cursor */}
            <div className="w-[12%] h-[12%] bg-[#00E5FF]/20 rounded-full animate-ping" />
            <div className="absolute w-[4px] h-[4px] bg-[#00E5FF] rounded-full" />
            
            {/* Outer radar lines */}
            <div className="absolute top-0 bottom-0 left-[50%] w-[1px] bg-[#00E5FF]/10" />
            <div className="absolute left-0 right-0 top-[50%] h-[1px] bg-[#00E5FF]/10" />
          </div>

          {/* Core HUD diagnostics info */}
          <div className="absolute flex flex-col items-center justify-center text-[10px] tracking-[0.2em] text-[#00E5FF] font-bold text-center">
            <span className="animate-pulse">SYSTEM SECURE</span>
            <span className="text-[#8B5CF6] text-[8px] mt-1 font-semibold">AES-256 / SHA3</span>
          </div>
        </div>

        {/* Bottom indicators and live telemetry feeds */}
        <div className="z-10 flex items-end justify-between">
          <div className="space-y-2.5 font-mono text-[10px] tracking-wider text-[#00E5FF]/85 pl-1">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-pulse shadow-[0_0_6px_#00FF9D]" />
              <span>SECURE INTERFACE CONNECTION</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-pulse shadow-[0_0_6px_#00FF9D]" />
              <span>LOGICAL NODE STATUS: ONLINE</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full shadow-[0_0_6px_#00E5FF]" />
              <span>ROLE-BASED ACCESS CONTROL ACTIVE</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full shadow-[0_0_6px_#8B5CF6]" />
              <span>WORKBOOK INTELLIGENCE PLATFORM LOADED</span>
            </div>
          </div>

          {/* Telemetry live variables widget */}
          <div className="font-mono text-[9px] text-[#94A3B8]/60 space-y-1 bg-black/40 px-4 py-3 rounded-lg border border-[#00E5FF]/10 backdrop-blur-md min-w-[150px]">
            <div className="flex justify-between">
              <span>SYS.LOC:</span>
              <span className="text-[#00E5FF]/90 font-bold">W-NODE-01</span>
            </div>
            <div className="flex justify-between">
              <span>LATENCY:</span>
              <span className="text-[#00E5FF] font-semibold">{latency}ms</span>
            </div>
            <div className="flex justify-between">
              <span>CORE_LOAD:</span>
              <span className="text-[#8B5CF6] font-semibold">{load}%</span>
            </div>
            <div className="flex justify-between">
              <span>DB_CONN:</span>
              <span className="text-[#00FF9D] font-semibold">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (40%) - Main login card terminal */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-12 md:p-16 relative bg-[#020617] min-h-screen">
        {/* Decorative micro grid pattern on mobile background */}
        <div className="lg:hidden absolute inset-0 opacity-15 pointer-events-none"
             style={{
               backgroundImage: `
                 linear-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(0, 229, 255, 0.05) 1px, transparent 1px)
               `,
               backgroundSize: '30px 30px',
             }}
        />

        <motion.div
          className="relative bg-[#080f1e]/85 backdrop-blur-md border border-[#00E5FF]/20 w-full max-w-md p-8 sm:p-10 rounded-xl overflow-hidden neon-glow-card z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Cyberpunk styled corner brackets */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00E5FF]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00E5FF]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00E5FF]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00E5FF]" />

          {/* Heading */}
          <div className="mb-8 text-center relative">
            <h2 className="text-2xl font-bold tracking-[0.2em] text-[#00E5FF] neon-text-glow font-mono uppercase">
              ACCESS TERMINAL
            </h2>
            <p className="text-[10px] text-[#94A3B8] tracking-widest font-mono uppercase mt-1">
              Authenticate to continue
            </p>
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/40 to-transparent mx-auto mt-4" />
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username input container */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold tracking-widest text-[#00E5FF]/80 uppercase font-mono" htmlFor="username">
                USER IDENTIFICATION
              </label>
              <div className="relative">
                <CyberInput
                  id="username"
                  type="text"
                  required
                  placeholder="ENTER UNIQUE ID / USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-4 pr-4 border-[#00E5FF]/30 hover:border-[#00E5FF]/50 transition-all font-mono tracking-wide placeholder-slate-600 focus:placeholder-slate-700"
                />
              </div>
            </div>

            {/* Password input container */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold tracking-widest text-[#00E5FF]/80 uppercase font-mono" htmlFor="password">
                ACCESS CIPHER / PASSWORD
              </label>
              <div className="relative">
                <CyberInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-4 pr-12 border-[#00E5FF]/30 hover:border-[#00E5FF]/50 transition-all font-mono tracking-wide placeholder-slate-600 focus:placeholder-slate-700"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-[#00E5FF] transition duration-300"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Checkbox "Remember Me" */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2.5 text-[10px] tracking-wider font-mono text-[#94A3B8] cursor-pointer hover:text-slate-200 transition select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-none bg-black/60 border border-[#00E5FF]/35 text-[#00E5FF] focus:ring-0 focus:ring-offset-0 focus:outline-none transition cursor-pointer"
                />
                <span>REMEMBER SIGN-IN PROTOCOL</span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="bg-[#FF4D6D]/10 border border-[#FF4D6D]/45 rounded-lg px-4 py-3 text-[#FF4D6D] text-[10px] font-mono tracking-wide text-center uppercase"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                [SYSTEM WARNING]: {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <CyberButton
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full tracking-[0.2em] font-mono font-bold uppercase border border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/10 py-3 rounded-lg relative overflow-hidden transition-all duration-300 hover:bg-[#00E5FF]/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.35)] active:scale-[0.98] disabled:opacity-40"
              >
                {isSubmitting ? "AUTHORIZING PROMPT..." : "INITIALIZE ACCESS"}
              </CyberButton>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
