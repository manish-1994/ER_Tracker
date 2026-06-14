import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { updateUser } from "../services/userService";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberBadge } from "../components/ui/CyberBadge";
import { CyberAvatar } from "../components/ui/CyberAvatar";

const Profile: React.FC = () => {
  const { appUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Local form state
  const [usernameInput, setUsernameInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Query database for user metadata (is_active)
  const { data: dbUser, isLoading: dbUserLoading } = useQuery({
    queryKey: ["dbProfile", appUser?.id],
    queryFn: async () => {
      if (!appUser?.id) return null;
      const { data, error } = await supabase
        .from("users")
        .select("is_active")
        .eq("id", appUser.id)
        .single();
      if (error) throw error;
      return {
        ...data,
        created_at: null
      };
    },
    enabled: !!appUser?.id,
  });

  useEffect(() => {
    if (appUser?.username) {
      setUsernameInput(appUser.username);
    }
  }, [appUser]);

  // Update profile mutation (custom users table)
  const profileMutation = useMutation({
    mutationFn: async (updatedName: string) => {
      if (!appUser?.id) return;
      await updateUser(appUser.id.toString(), { username: updatedName });
    },
    onSuccess: () => {
      toast.success("User credentials synchronized successfully.");
      queryClient.invalidateQueries({ queryKey: ["dbProfile", appUser?.id] });
      // Update local storage user session info
      const stored = localStorage.getItem("appUser");
      if (stored && appUser) {
        const parsed = JSON.parse(stored);
        parsed.username = usernameInput;
        localStorage.setItem("appUser", JSON.stringify(parsed));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile name");
    }
  });

  // Password mutation (custom users table)
  const passwordMutation = useMutation({
    mutationFn: async (passwordVal: string) => {
      if (!appUser?.id) return;
      await updateUser(appUser.id.toString(), { password: passwordVal });
    },
    onSuccess: () => {
      toast.success("Security passkey updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update passkey.");
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    if (!usernameInput) return;
    profileMutation.mutate(usernameInput);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");
    if (!newPassword) {
      setPassError("Password field cannot be empty.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Password verification mismatch.");
      return;
    }
    passwordMutation.mutate(newPassword);
  };

  if (!appUser) {
    return (
      <div className="p-10 text-center font-mono text-muted animate-pulse">
        Access Denied: Synchronize session credentials...
      </div>
    );
  }

  const roleVariant: Record<string, "primary" | "secondary" | "success" | "warning" | "danger"> = {
    superadmin: "danger",
    admin: "secondary",
    manager: "primary",
    analyst: "warning",
    viewer: "success",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-mono font-black tracking-wider text-primary uppercase neon-text-primary">
          Operator Profile Center
        </h1>
        <p className="text-muted font-mono text-sm">
          Operator credentials & system security clearances panel
        </p>
      </div>

      {/* Profile ID Card */}
      <CyberCard variant="primary" className="flex flex-col md:flex-row items-center gap-6 p-6 relative overflow-hidden">
        <div className="flex-shrink-0">
          <CyberAvatar username={appUser.username} size="lg" isOnline={dbUser?.is_active ?? true} />
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-3xl font-mono font-black text-primary uppercase tracking-wider neon-text-primary">
            {appUser.username}
          </h2>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {(appUser.roles || []).map((role) => (
              <CyberBadge key={role} variant={roleVariant[role.toLowerCase()] || "muted"}>
                {role}
              </CyberBadge>
            ))}
            {(!appUser.roles || appUser.roles.length === 0) && (
              <CyberBadge variant="muted">NO CLEARANCE</CyberBadge>
            )}
          </div>

          <div className="text-xs font-mono text-muted space-y-1 pt-2">
            <div>OPERATOR NODE ID: <span className="text-text font-bold">0{appUser.id}</span></div>
            {dbUser?.created_at && (
              <div>COMMISSIONED DATE: <span className="text-text font-bold">
                {new Date(dbUser.created_at).toLocaleString()}
              </span></div>
            )}
          </div>
        </div>
      </CyberCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Info Change */}
        <CyberCard className="space-y-4">
          <h3 className="text-md font-mono font-bold tracking-widest text-primary uppercase border-b border-cyan-500/25 pb-2">
            Operator Settings
          </h3>
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileSuccess && (
              <div className="p-3 bg-success/10 border border-success/40 text-success text-xs font-mono rounded">
                {profileSuccess}
              </div>
            )}

            <div className="space-y-1 font-mono">
              <label className="text-xs text-muted uppercase tracking-wider">Username Handle</label>
              <CyberInput 
                type="text" 
                value={usernameInput} 
                onChange={(e) => setUsernameInput(e.target.value)} 
                required
              />
            </div>

            <div className="pt-2">
              <CyberButton type="submit" variant="primary" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? "Syncing..." : "Sync Credentials"}
              </CyberButton>
            </div>
          </form>
        </CyberCard>

        {/* Password Update console */}
        <CyberCard variant="secondary" className="space-y-4">
          <h3 className="text-md font-mono font-bold tracking-widest text-secondary uppercase border-b border-purple-500/25 pb-2">
            Security Passkey Change
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passError && (
              <div className="p-3 bg-danger/10 border border-danger/40 text-danger text-xs font-mono rounded">
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="p-3 bg-success/10 border border-success/40 text-success text-xs font-mono rounded">
                {passSuccess}
              </div>
            )}

            <div className="space-y-1 font-mono">
              <label className="text-xs text-muted uppercase tracking-wider">New Password</label>
              <CyberInput 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-1 font-mono">
              <label className="text-xs text-muted uppercase tracking-wider">Verify Password</label>
              <CyberInput 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-2">
              <CyberButton type="submit" variant="secondary" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? "Re-keying..." : "Update Passkey"}
              </CyberButton>
            </div>
          </form>
        </CyberCard>
      </div>
    </div>
  );
};

export default Profile;
