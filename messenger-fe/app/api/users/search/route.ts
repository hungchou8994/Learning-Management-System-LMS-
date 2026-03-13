import { NextResponse } from "next/server";
import { getAuthedUserFromCookies, getGatewayBaseServer } from "@/lib/serverAuth";

type UserSearchItem = {
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export async function GET(req: Request) {
  const authed = await getAuthedUserFromCookies();
  if (!authed.ok) return authed.response;

  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const mode = String(url.searchParams.get("mode") || "name").trim().toLowerCase();
  const limit = Math.min(30, Math.max(1, parseInt(String(url.searchParams.get("limit") || "10"), 10) || 10));

  if (!q) return NextResponse.json({ ok: true, data: [] as UserSearchItem[] });

  const qs = new URLSearchParams({
    q,
    mode: mode === "username" ? "username" : "name",
    limit: String(limit),
  }).toString();

  try {
    const resp = await fetch(`${getGatewayBaseServer()}/api/elearn/user/search?${qs}`, {
      method: "GET",
      headers: { Cookie: authed.cookieHeader },
      cache: "no-store",
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data || data.status !== "success") {
      return NextResponse.json(
        { ok: false, error: data?.message || "Failed to search users" },
        { status: resp.status || 500 }
      );
    }
    return NextResponse.json({ ok: true, data: (data.data || []) as UserSearchItem[] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Network error" },
      { status: 502 }
    );
  }
}


