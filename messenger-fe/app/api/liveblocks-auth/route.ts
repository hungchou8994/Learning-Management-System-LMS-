import { NextResponse } from "next/server";
import { getAuthedUserFromCookies, getGatewayBaseServer } from "@/lib/serverAuth";
import { getLiveblocksServer, normalizeUsername } from "@/lib/liveblocksServer";

function fullNameFromProfile(p: { firstName?: string; lastName?: string } | null | undefined) {
  const first = String(p?.firstName || "").trim();
  const last = String(p?.lastName || "").trim();
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || "";
}

export async function POST(req: Request) {
  const authed = await getAuthedUserFromCookies();
  if (!authed.ok) return authed.response;

  const body = await req.json().catch(() => null);
  const room = String(body?.room || "").trim();
  if (!room) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  const liveblocks = getLiveblocksServer();
  const userId = normalizeUsername(authed.user.username);

  // If room exists, ensure user has access via usersAccesses.
  try {
    const info = await liveblocks.getRoom(room);
    const accesses = (info as any)?.usersAccesses || {};
    const myAccess = accesses?.[userId];
    if (!myAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (e: any) {
    // If room not found, deny. Rooms should be created via our API.
    const msg = String(e?.message || "");
    if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("404")) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    // Unknown error -> surface
    return NextResponse.json({ error: "Failed to authorize" }, { status: 500 });
  }

  // Create auth session for this user
  let displayName = authed.user.username;
  try {
    const resp = await fetch(`${getGatewayBaseServer()}/api/elearn/user/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authed.cookieHeader,
      },
      body: JSON.stringify({ usernames: [authed.user.username] }),
      cache: "no-store",
    });
    const data = await resp.json().catch(() => null);
    if (resp.ok && data?.status === "success" && Array.isArray(data?.data) && data.data[0]) {
      const name = fullNameFromProfile(data.data[0]);
      if (name) displayName = name;
    }
  } catch {
    // ignore
  }

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name: displayName, avatar: undefined },
  });

  // Allow only the requested room (user must already be in usersAccesses)
  session.allow(room, session.FULL_ACCESS);

  const { status, body: resBody } = await session.authorize();
  return new NextResponse(resBody, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}


