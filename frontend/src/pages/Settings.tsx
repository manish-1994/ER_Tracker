import React, { useState, useEffect } from "react";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberInput } from "../components/ui/CyberInput";
import { PageHeader } from "../components/ui/PageHeader";
import { CyberModal } from "../components/ui/CyberModal";
import { useToast } from "../context/ToastContext";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

export const Settings: React.FC = () => {
  const toast = useToast();
  const { settings, updateSettings, playSound } = useSettings();
  const { appUser } = useAuth();
  
  const [hudAccent, setHudAccent] = useState(settings.hudAccent);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [refreshInterval, setRefreshInterval] = useState(settings.refreshInterval);
  const [devConsoleMode, setDevConsoleMode] = useState(settings.devConsoleMode);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    setHudAccent(settings.hudAccent);
    setSoundEnabled(settings.soundEnabled);
    setRefreshInterval(settings.refreshInterval);
    setDevConsoleMode(settings.devConsoleMode);
  }, [settings]);

  const handleSaveSettings = () => {
    updateSettings({ hudAccent, soundEnabled, refreshInterval, devConsoleMode });
    playSound("success");
    toast.success("Cybernetic HUD settings written successfully");
  };

  const handlePurgeConfirm = () => {
    localStorage.removeItem("dashboard_assignments");
    toast.success("Dashboard widget telemetry databases purged.");
    setShowPurgeModal(false);
    setConfirmText("");
  };

  const handlePurgeDashboardConfigs = () => {
    const isSuperAdmin = appUser?.roles?.includes("SuperAdmin") ?? false;
    if (!isSuperAdmin) {
      toast.error("SuperAdmin access required for purge operations");
      return;
    }
    setShowPurgeModal(true);
  };

  const isSuperAdmin = appUser?.roles?.includes("SuperAdmin") ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="HUD Configuration Panel"
        subtitle="Calibrate operational display parameters, visual themes, telemetry refresh intervals, and node overrides"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core HUD settings */}
        <CyberCard className="space-y-4">
          <h2 className="text-sm font-sans font-bold tracking-widest text-primary uppercase border-b border-accent/25 pb-2">
            Visual and Sound Calibrations
          </h2>

          <div className="space-y-4 font-sans text-xs">
            {/* HUD Accent */}
            <div className="space-y-2">
              <label className="block text-[10px] text-theme-muted uppercase font-bold tracking-wider">
                HUD Neon Theme Accent
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["cyan", "purple", "green"].map((acc) => (
                  <button
                    key={acc}
                    onClick={() => { setHudAccent(acc as any); playSound("click"); }}
                    className={`p-2 border rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      hudAccent === acc
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-accent/10 bg-black/40 text-theme-muted hover:border-accent/30"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      acc === "cyan" ? "bg-accent" : acc === "purple" ? "bg-secondary" : "bg-success"
                    }`} />
                    <span className="capitalize">{acc} Accents</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggles */}
            <div className="flex items-center justify-between p-2 border border-accent/10 bg-theme-card/50 rounded-lg">
              <div>
                <div className="font-bold text-text uppercase">Sound Synthesizer Effects</div>
                <div className="text-[10px] text-theme-muted">Audio feedback cues on command execution</div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => { setSoundEnabled(e.target.checked); playSound("click"); }}
                className="w-4 h-4 text-primary bg-black border-accent/30 rounded focus:ring-primary focus:ring-1"
              />
            </div>

            {/* Dev Console */}
            <div className="flex items-center justify-between p-2 border border-accent/10 bg-theme-card/50 rounded-lg">
              <div>
                <div className="font-bold text-text uppercase">Matrix Debug Console</div>
                <div className="text-[10px] text-theme-muted">Show operational raw queries in console HUD</div>
              </div>
              <input
                type="checkbox"
                checked={devConsoleMode}
                onChange={(e) => { setDevConsoleMode(e.target.checked); playSound("click"); }}
                className="w-4 h-4 text-primary bg-black border-accent/30 rounded focus:ring-primary focus:ring-1"
              />
            </div>
          </div>
        </CyberCard>

        {/* Telemetry settings */}
        <div className="space-y-6">
          <CyberCard variant="secondary" className="space-y-4">
            <h2 className="text-sm font-sans font-bold tracking-widest text-secondary uppercase border-b border-secondary/25 pb-2">
              Telemetry Synchronizations
            </h2>

            <div className="space-y-4 font-sans text-xs">
              {/* Refresh rate */}
              <div className="space-y-1">
              <label className="block text-[10px] text-theme-muted uppercase font-bold tracking-wider">
                Sync Telemetry Interval
              </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => { setRefreshInterval(Number(e.target.value)); playSound("click"); }}
                  className="w-full px-3 py-2 bg-theme-card border border-secondary/20 text-text text-xs focus:outline-none focus:border-secondary rounded-lg transition-all"
                >
                  <option value={10}>10 Seconds (High Load)</option>
                  <option value={30}>30 Seconds (Default)</option>
                  <option value={60}>60 Seconds (Standard)</option>
                  <option value={300}>5 Minutes (Eco Bandwidth)</option>
                </select>
              </div>
            </div>
          </CyberCard>

          <CyberCard variant="secondary" className="space-y-4">
            <h2 className="text-sm font-sans font-bold tracking-widest text-danger uppercase border-b border-danger/25 pb-2">
              Emergency Override Protocols
            </h2>
            <div className="space-y-3 font-sans text-xs">
              <p className="text-[10px] text-theme-muted">
                Purge all custom layout indexes, dashboard widgets, and user mappings currently cached on this terminal node.
              </p>
              <button
                onClick={handlePurgeDashboardConfigs}
                disabled={!isSuperAdmin}
                className={`w-full flex items-center justify-center px-4 py-2 border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Purge Dashboard Mappings Database
              </button>
              {!isSuperAdmin && (
                <div className="text-[10px] text-warning">SuperAdmin role required</div>
              )}
            </div>
          </CyberCard>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <CyberButton onClick={handleSaveSettings} variant="primary" className="px-8">
          Apply and Save HUD Settings
        </CyberButton>
      </div>

      <CyberModal isOpen={showPurgeModal} onClose={() => setShowPurgeModal(false)} title="CONFIRM PURGE">
        <div className="space-y-4">
          <p className="text-xs text-theme-secondary">
            Type <span className="font-bold text-danger">CONFIRM</span> to purge all dashboard configurations.
          </p>
          <CyberInput
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type CONFIRM to proceed"
            className="w-full"
          />
<div className="flex gap-2 justify-end">
                <CyberButton variant="secondary" onClick={() => setShowPurgeModal(false)}>Cancel</CyberButton>
                <CyberButton 
                  variant="danger" 
                  onClick={handlePurgeConfirm}
                  disabled={confirmText !== "CONFIRM"}
                >
                  Purge All
                </CyberButton>
              </div>
        </div>
      </CyberModal>
    </div>
  );
};

export default Settings;
