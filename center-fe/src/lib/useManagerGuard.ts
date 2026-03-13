"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthMe } from "@/lib/api";

export function useManagerGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const me = await getAuthMe();
      const nextRole = me.success ? me.data?.role || null : null;
      setRole(nextRole);

      if (nextRole !== "manager" && nextRole !== "admin") {
        router.replace("/sign-in");
      }
      setLoading(false);
    };
    run();
  }, [router]);

  return { loading, role };
}


