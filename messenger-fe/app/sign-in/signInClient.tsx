"use client";

import { authLogin } from "@/lib/auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function SignInClient({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await authLogin({ username: username.trim(), password });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push(redirectTo || "/messenger");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-panel p-6 shadow-xl">
        <div className="mb-6">
          <div className="text-2xl font-extrabold">SkillGro Messenger</div>
          <div className="text-sm text-white/70">
            Sign in with your SkillGro account
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-500/10 text-red-200 border border-red-500/20 px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/70">Username</label>
            <input
              className="w-full rounded-xl bg-app-panel2 border border-app-border px-3 py-2 outline-none focus:border-brand-blue"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="student_01"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/70">Password</label>
            <input
              type="password"
              className="w-full rounded-xl bg-app-panel2 border border-app-border px-3 py-2 outline-none focus:border-brand-blue"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-blue px-3 py-2 font-semibold hover:bg-brand-blue2 disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-xs text-white/60">
          Tip: if you are already logged in on other SkillGro apps, your cookies
          may work here too.
        </div>
      </div>
    </main>
  );
}
