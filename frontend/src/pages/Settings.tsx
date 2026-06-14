import React, { useState, useEffect } from "react";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberBadge } from "../components/ui/CyberBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { useToast } from "../context/ToastContext";

export const Settings: React.FC = () => {
  const toast = useToast();
  
  // Custom HUD Configuration States
  const [hudAccent, setHudAccent] = useState<string>("cyan");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [telemetryMode, setTelemetryMode] = useState<string>("live");
  const [devConsoleMode, setDevConsoleMode] = useState<boolean>(false);

  // Load settings on init
  useEffect(() => {
    const savedAccent = localStorage.getItem("setting_hud_accent") || "cyan";
    const savedSound = localStorage.getItem("setting_sound_effects") !== "false";
    const savedRefresh = parseInt(localStorage.getItem("setting_refresh_interval") || "30");
    const savedMode = localStorage.getItem("setting_telemetry_mode") || "live";
    const savedConsole = localStorage.getItem("setting_dev_console") === "true";

    setHudAccent(savedAccent);
    setSoundEnabled(savedSound);
    setRefreshInterval(savedRefresh);
    setTelemetryMode(savedMode);
    setDevConsoleMode(savedConsole);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("setting_hud_accent", hudAccent);
    localStorage.setItem("setting_sound_effects", String(soundEnabled));
    localStorage.setItem("setting_refresh_interval", String(refreshInterval));
    localStorage.setItem("setting_telemetry_mode", telemetryMode);
    localStorage.setItem("setting_dev_console", String(devConsoleMode));
    
    toast.success("Cybernetic HUD settings written successfully");
  };

  const handlePurgeDashboardConfigs = () => {
    if (window.confirm("WARNING: Are you sure you want to purge all custom dashboard widget assignments? This cannot be undone.")) {
      localStorage.removeItem("dashboard_assignments");
      toast.success("Dashboard widget telemetry databases purged.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="HUD Configuration Panel"
        subtitle="Calibrate operational display parameters, visual themes, telemetry refresh intervals, and node overrides"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core HUD settings */}
        <CyberCard className="space-y-4">
          <h2 className="text-sm font-mono font-bold tracking-widest text-primary uppercase border-b border-cyan-500/25 pb-2">
            Visual & Sound Calibrations
          </h2>

          <div className="space-y-4 font-mono text-xs">
            {/* HUD Accent */}
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                HUD Neon Theme Accent
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cyan", name: "Cyan Accents", color: "#00E5FF" },
                  { id: "purple", name: "Purple Neon", color: "#D500F9" },
                  { id: "green", name: "Green Protocol", color: "#00FF9D" },
                ].map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setHudAccent(acc.id)}
                    className={`p-2 border rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      hudAccent === acc.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-cyan-500/10 bg-black/40 text-slate-400 hover:border-cyan-500/30"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color }} />
                    <span>{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggles */}
            <div className="flex items-center justify-between p-2 border border-cyan-500/10 bg-[#050b14]/50 rounded-lg">
              <div>
                <div className="font-bold text-text uppercase">Sound Synthesizer Effects</div>
                <div className="text-[10px] text-slate-500">Audio feedback cues on command execution</div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 text-primary bg-black border-cyan-500/30 rounded focus:ring-primary focus:ring-1"
              />
            </div>

            {/* Dev Console */}
            <div className="flex items-center justify-between p-2 border border-cyan-500/10 bg-[#050b14]/50 rounded-lg">
              <div>
                <div className="font-bold text-text uppercase">Matrix Debug Console</div>
                <div className="text-[10px] text-slate-500">Show operational raw queries in console HUD</div>
              </div>
              <input
                type="checkbox"
                checked={devConsoleMode}
                onChange={(e) => setDevConsoleMode(e.target.checked)}
                className="w-4 h-4 text-primary bg-black border-cyan-500/30 rounded focus:ring-primary focus:ring-1"
              />
            </div>
          </div>
        </CyberCard>

        {/* Telemetry settings */}
        <div className="space-y-6">
          <CyberCard variant="secondary" className="space-y-4">
            <h2 className="text-sm font-mono font-bold tracking-widest text-secondary uppercase border-b border-purple-500/25 pb-2">
              Telemetry Synchronizations
            </h2>

            <div className="space-y-4 font-mono text-xs">
              {/* Refresh rate */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Sync Telemetry Interval
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#050b14] border border-purple-500/20 text-[#E2E8F0] text-xs focus:outline-none focus:border-secondary rounded-lg transition-all"
                >
                  <option value={10}>10 Seconds (High Load)</option>
                  <option value={30}>30 Seconds (Default)</option>
                  <option value={60}>60 Seconds (Standard)</option>
                  <option value={300}>5 Minutes (Eco Bandwidth)</option>
                </select>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Live PostgREST Telemetry Mode
                </label>
                <select
                  value={telemetryMode}
                  onChange={(e) => setTelemetryMode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050b14] border border-purple-500/20 text-[#E2E8F0] text-xs focus:outline-none focus:border-secondary rounded-lg transition-all"
                >
                  <option value="live">Synchronous Live Queries (Supabase)</option>
                  <option value="cached">Client-Side Storage Buffering</option>
                </select>
              </div>
            </div>
          </CyberCard>

          <CyberCard variant="secondary" className="space-y-4">
            <h2 className="text-sm font-mono font-bold tracking-widest text-[#FF4D6D] uppercase border-b border-rose-500/25 pb-2">
              Emergency Override Protocols
            </h2>
            <div className="space-y-3 font-mono text-xs">
              <p className="text-[10px] text-slate-400">
                Purge all custom layout indexes, dashboard widgets, and user mappings currently cached on this terminal node.
              </p>
              <button
                onClick={handlePurgeDashboardConfigs}
                className="w-full flex items-center justify-center px-4 py-2 border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 text-xs font-bold rounded-lg uppercase tracking-wider transition-all"
              >
                Purge Dashboard Mappings Database
              </button>
            </div>
          </CyberCard>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <CyberButton onClick={handleSaveSettings} variant="primary" className="px-8">
          Apply & Save HUD Settings
        </CyberButton>
      </div>
    </div>
  );
};

export default Settings;
