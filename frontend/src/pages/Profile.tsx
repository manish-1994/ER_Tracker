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
  const [usernameInput, setUsernameInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const { data: dbUser } = useQuery({
    queryKey: ["dbProfile", appUser?.id],
    queryFn: async () => {
      if (!appUser?.id) return null;
      const { data } = await supabase.from("users").select("is_active").eq("id", appUser.id).single();
      return data ? { ...data, created_at: null } : null;
    },
    enabled: !!appUser?.id,
  });

  useEffect(() => {
    if (appUser?.username) setUsernameInput(appUser.username);
  }, [appUser]);

  const profileMutation = useMutation({
    mutationFn: async (updatedName: string) => {
      if (!appUser?.id) return;
      await updateUser(appUser.id.toString(), { username: updatedName });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["dbProfile", appUser?.id] });
      const stored = localStorage.getItem("appUser");
      if (stored && appUser) {
        const parsed = JSON.parse(stored);
        parsed.username = usernameInput;
        localStorage.setItem("appUser", JSON.stringify(parsed));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    }
  });

  const passwordMutation = useMutation({
    mutationFn: async (passwordVal: string) => {
      if (!appUser?.id) return;
      await updateUser(appUser.id.toString(), { password: passwordVal });
    },
    onSuccess: () => {
      toast.success("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update password.");
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
    if (!newPassword) {
      setPassError("Password field cannot be empty.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match.");
      return;
    }
    passwordMutation.mutate(newPassword);
  };

  if (!appUser) {
    return (
      <div className="p-10 text-center font-sans text-secondary animate-pulse">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-sans font-bold tracking-tight text-textPrimary">
          Profile
        </h1>
        <p className="text-secondary font-sans text-sm">
          Manage your account settings
        </p>
      </div>

      <CyberCard className="flex flex-col md:flex-row items-center gap-6 p-6">
        <div className="flex-shrink-0">
          <CyberAvatar username={appUser.username} size="lg" isOnline={dbUser?.is_active ?? true} />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-2xl font-sans font-bold text-textPrimary">
            {appUser.username}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {(appUser.roles || []).map((role) => (
              <CyberBadge key={role} variant="primary">
                {role}
              </CyberBadge>
            ))}
          </div>
          <div className="text-xs font-mono text-secondary space-y-1 pt-2">
            <div>User ID: <span className="text-textPrimary font-bold">{appUser.id}</span></div>
          </div>
        </div>
      </CyberCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CyberCard className="space-y-4">
          <h3 className="text-md font-sans font-semibold text-textPrimary border-b border-secondary pb-2">
            Profile Settings
          </h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileSuccess && (
              <div className="p-3 bg-success/10 border border-success/30 text-success text-xs font-sans rounded">
                {profileSuccess}
              </div>
            )}
            <div className="space-y-1 font-sans">
              <label className="text-xs text-secondary">Username</label>
              <CyberInput 
                type="text" 
                value={usernameInput} 
                onChange={(e) => setUsernameInput(e.target.value)} 
                required
              />
            </div>
            <div className="pt-2">
              <CyberButton type="submit" variant="primary" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? "Saving..." : "Save Changes"}
              </CyberButton>
            </div>
          </form>
        </CyberCard>

        <CyberCard className="space-y-4">
          <h3 className="text-md font-sans font-semibold text-textPrimary border-b border-secondary pb-2">
            Change Password
          </h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passError && (
              <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-xs font-sans rounded">
                {passError}
              </div>
            )}
            <div className="space-y-1 font-sans">
              <label className="text-xs text-secondary">New Password</label>
              <CyberInput 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-1 font-sans">
              <label className="text-xs text-secondary">Confirm Password</label>
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
                {passwordMutation.isPending ? "Updating..." : "Update Password"}
              </CyberButton>
            </div>
          </form>
        </CyberCard>
      </div>
    </div>
  );
};

export default Profile;