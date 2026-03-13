"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthMe } from "@/lib/api";

export function useRoleGuard(allowedRoles: readonly string[]) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // NOTE: callers often pass array literals => new reference every render.
  // Use a stable key derived from values to avoid infinite re-fetch loops.
  const allowedKey = [...allowedRoles].sort().join("|");
  const allowedSet = useMemo(() => {
    const parts = allowedKey ? allowedKey.split("|").filter(Boolean) : [];
    return new Set(parts);
  }, [allowedKey]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const me = await getAuthMe();
        const nextRole = me.success ? me.data?.role || null : null;
        if (!alive) return;
        setRole(nextRole);

        if (!nextRole || !allowedSet.has(nextRole)) {
          router.replace("/sign-in");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [router, allowedSet]);

  return { loading, role };
}


