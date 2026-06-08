import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

/** Detailed cyber‑punk profile page */
const Profile = () => {
  const queryClient = useQueryClient();
  // Retrieve token once at component level (Hooks must be called at top level)
  const { token } = useAuth();

  // Fetch profile data
  // Debug: log when fetchProfile is invoked
  const fetchProfile = async () => {
    console.log("Profile query started");
    console.log("Token from localStorage:", localStorage.getItem("jwt"));
    try {
      const headers: any = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      // Note: omit leading slash so axios respects the baseURL (/api)
      const { data } = await api.get("profile", { headers });
      console.log("Profile fetch successful", data);
      return data;
    } catch (err) {
      console.error("Profile fetch failed:", err);
      throw err;
    }
  };
  const { data, isLoading, error } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  // Mutations for updating profile and password
  const updateProfile = useMutation({
    mutationFn: async (updates: any) => {
      await api.put("/profile", updates);
    },
    // Invalidate the "profile" query after successful update using the proper filter object
    // Invalidate the "profile" query after a successful update using the correct API signature
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const changePassword = useMutation({
    mutationFn: async (payload: any) => {
      await api.put("/profile/password", payload);
    },
    onSuccess: () => alert("Password updated"),
  });

  // Local form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  // Initialise form when data loads
  React.useEffect(() => {
    if (data) {
      setFullName(data.full_name || "");
      setEmail(data.email || "");
    }
  }, [data]);

  if (isLoading) return <div className="p-6 text-gray-200">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-500">Failed to load profile</div>;

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0a0f1a] p-6">
      <motion.div
        className="bg-black/70 backdrop-blur-lg p-8 rounded-lg border border-cyan-500/30 w-full max-w-4xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-center text-cyan-300 mb-6">User Profile</h2>
        {/* User Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xl font-medium text-cyan-200 mb-2">Account Information</h3>
            <p className="text-gray-300"><span className="font-semibold">Username:</span> {data?.username ?? ""}</p>
            <p className="text-gray-300"><span className="font-semibold">Full Name:</span> {fullName}</p>
            <p className="text-gray-300"><span className="font-semibold">Email:</span> {email}</p>
          </div>
          <div>
            <h3 className="text-xl font-medium text-cyan-200 mb-2">Role & Permissions</h3>
            {/* Backend returns an array of role objects */}
            <p className="text-gray-300"><span className="font-semibold">Roles:</span> {data?.roles?.map((r: any) => r.name).join(', ')}</p>
            <ul className="list-disc list-inside text-gray-300 mt-2">
              {data?.permissions?.map((perm: any) => (
                <li key={perm.id}>{perm.name}</li>
              ))}
            </ul>
          </div>
        </div>
         {/* Account Settings */}
         <div className="border-t border-cyan-500/30 pt-6">
           <h3 className="text-xl font-medium text-cyan-200 mb-4">Account Settings</h3>
           <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); updateProfile.mutate({ full_name: fullName, email }); }}>
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="fullName">Full Name</label>
               <input id="fullName" type="text" className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" value={fullName} onChange={(e) => setFullName(e.target.value)} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">Email</label>
               <input id="email" type="email" className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" value={email} onChange={(e) => setEmail(e.target.value)} />
             </div>
             <motion.button type="submit" className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded shadow-lg" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Update Profile</motion.button>
           </form>
         </div>
        {/* Change Password */}
        <div className="border-t border-cyan-500/30 pt-6 mt-6">
          <h3 className="text-xl font-medium text-cyan-200 mb-4">Change Password</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); changePassword.mutate({ current_password: currentPw, new_password: newPw }); }}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="currentPw">Current Password</label>
              <input id="currentPw" type="password" className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="newPw">New Password</label>
              <input id="newPw" type="password" className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <motion.button type="submit" className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded shadow-lg" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Change Password</motion.button>
          </form>
        </div>
        {/* Last Login */}
        <div className="text-center text-gray-400 mt-6">
          Last login: {new Date(data.last_login).toLocaleString()}
        </div>
      </motion.div>
    </section>
  );
};

export default Profile;
