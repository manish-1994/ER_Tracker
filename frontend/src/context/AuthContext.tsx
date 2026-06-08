import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
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
    // FastAPI expects OAuth2PasswordRequestForm (application/x-www-form-urlencoded)
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);
    // Use relative path without duplicate '/api' prefix; baseURL already includes '/api'
    const response = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const jwt = response.data.access_token;
    // Store the JWT token for future requests
    localStorage.setItem('jwt', jwt);
    setToken(jwt);
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
