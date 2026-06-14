import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getCurrentApplicationUser, AppUser, loginUser } from "../services/authHelper";
import { useNavigate } from "react-router-dom";
import { validateSchema } from "../services/schemaValidation";

interface AuthContextProps {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  appUser: AppUser | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem("appUser");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setSession({ access_token: "local" });

        const enriched = await getCurrentApplicationUser();
        if (enriched) {
          setAppUser(enriched);
          localStorage.setItem("appUser", JSON.stringify(enriched));
          
        } else {
          setAppUser(parsed);
        }
      }
      setLoading(false);
      
      // Validate schema on startup
      const schemaResults = await validateSchema();
      const missing = Object.entries(schemaResults)
        .filter(([_, r]) => !r.exists)
        .map(([t]) => t);
      if (missing.length > 0) {
        
      }
    };
    restore();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const sessionUser = await loginUser(username, password);
      
      setUser(sessionUser);
      setSession({ access_token: "local" });
      setAppUser({
        id: sessionUser.id,
        username: sessionUser.username,
        roles: sessionUser.roles ?? [],
        permissions: sessionUser.permissions ?? [],
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("CUSTOM LOGIN ERROR:", err);
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem("appUser");
    setUser(null);
    setSession(null);
    setAppUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        token: session?.access_token ?? null,
        login,
        logout,
        loading,
        appUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

