import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { JWT_STORAGE_KEY } from "../config/appConfig";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface AuthContextProps {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("jwt");
    if (stored) setToken(stored);
  }, []);

  const login = async (username: string, password: string) => {
    // Debug payload information before sending request
    console.log("USERNAME RAW:", username);
    console.log("PASSWORD RAW:", password);
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);
    console.log("FORM DATA:", form.toString());
    console.log("JSON.stringify(username):", JSON.stringify(username));
    console.log("username length:", username.length);
    // FastAPI expects OAuth2PasswordRequestForm (application/x-www-form-urlencoded)
    const response = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const jwt = response.data.access_token;
    // Store the JWT token for future requests
    localStorage.setItem(JWT_STORAGE_KEY, jwt);
    setToken(jwt);
    navigate("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    setToken(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
