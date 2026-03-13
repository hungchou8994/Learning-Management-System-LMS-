import { NextResponse } from "next/server";
import { getAuthedUserFromCookies, getGatewayBaseServer } from "@/lib/serverAuth";

type UserProfile = {
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export async function POST(req: Request) {
  const authed = await getAuthedUserFromCookies();
  if (!authed.ok) return authed.response;

  const body = await req.json().catch(() => null);
  const usernamesRaw = Array.isArray(body?.usernames) ? body.usernames : [];
  const usernames = Array.from(
    new Set(
      usernamesRaw
        .map((u: unknown) => String(u || "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 200);

  if (usernames.length === 0) {
    return NextResponse.json({ ok: true, data: [] as UserProfile[] });
  }

  try {
    const resp = await fetch(`${getGatewayBaseServer()}/api/elearn/user/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authed.cookieHeader,
      },
      body: JSON.stringify({ usernames }),
      cache: "no-store",
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data || data.status !== "success") {
      return NextResponse.json(
        { ok: false, error: data?.message || "Failed to load profiles" },
        { status: resp.status || 500 }
      );
    }
    return NextResponse.json({ ok: true, data: (data.data || []) as UserProfile[] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Network error" },
      { status: 502 }
    );
  }
}


