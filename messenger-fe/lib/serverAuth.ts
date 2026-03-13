import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type AuthedUser = {
  id: string | number;
  username: string;
  role: string;
  email?: string;
};

const DEFAULT_GATEWAY = "http://localhost:3000";

function normalizeBaseUrl(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return DEFAULT_GATEWAY;
  if (!/^https?:\/\//i.test(s)) {
    return `http://${s}`.replace(/\/+$/, "");
  }
  return s.replace(/\/+$/, "");
}

export function getGatewayBaseServer() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_GATEWAY_URL || DEFAULT_GATEWAY);
}

export async function getAuthedUserFromCookies(): Promise<
  | { ok: true; user: AuthedUser; cookieHeader: string }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) {
    return { ok: false, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  let resp: Response;
  try {
    resp = await fetch(`${getGatewayBaseServer()}/api/auth/me`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
  } catch (e: unknown) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            e instanceof Error
              ? e.message
              : "Failed to reach API gateway (check NEXT_PUBLIC_API_GATEWAY_URL)",
        },
        { status: 502 }
      ),
    };
  }

  const data = await resp.json().catch(() => null);
  if (!resp.ok || !data || data.status !== "success" || !data.user?.username) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: data?.message || "Not authenticated" },
        { status: resp.status || 401 }
      ),
    };
  }

  return { ok: true, user: data.user as AuthedUser, cookieHeader };
}


