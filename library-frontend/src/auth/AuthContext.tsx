import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "../types";
import { loginApi, logoutApi, meApi } from "../api/auth";

type AuthState = { user: User | null; loading: boolean };

type AuthCtx = AuthState & {
  login: (identifier: string, password: string, otp?: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

function readInitialUser(): User | null {
  const userRaw = localStorage.getItem("user");
  return userRaw ? (JSON.parse(userRaw) as User) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    user: readInitialUser(),
    loading: true,
  }));

  useEffect(() => {
    (async () => {
      try {
        const res = await meApi();
        localStorage.removeItem("token");
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setState({ user: res.data.user, loading: false });
      } catch {
        localStorage.removeItem("user");
        setState({ user: null, loading: false });
      }
    })();
  }, []);

  const login = async (identifier: string, password: string, otp?: string) => {
    const res = await loginApi(identifier, password, otp);
    localStorage.removeItem("token");
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setState({ user: res.data.user, loading: false });
  };

  const logout = () => {
    logoutApi().catch(() => null);
    localStorage.removeItem("user");
    setState({ user: null, loading: false });
  };

  const value = useMemo(() => ({ ...state, login, logout }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
