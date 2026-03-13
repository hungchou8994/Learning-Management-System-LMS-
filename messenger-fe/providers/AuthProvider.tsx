"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authLogout, authMe, MessengerAuthUser } from "@/lib/auth";

type MessengerAuthContextValue = {
  user: MessengerAuthUser | null;
  isLoaded: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const MessengerAuthContext = createContext<MessengerAuthContextValue | null>(null);

export function useMessengerAuth() {
  const ctx = useContext(MessengerAuthContext);
  if (!ctx) throw new Error("useMessengerAuth must be used within <MessengerAuthProvider />");
  return ctx;
}

export default function MessengerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MessengerAuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const res = await authMe();
    setUser(res.ok ? res.data : null);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setIsLoaded(true);
  }, []);

  const value = useMemo(
    () => ({ user, isLoaded, refresh, logout }),
    [user, isLoaded, refresh, logout]
  );

  return <MessengerAuthContext.Provider value={value}>{children}</MessengerAuthContext.Provider>;
}


