import { NextResponse } from "next/server";
import { getAuthedUserFromCookies } from "@/lib/serverAuth";
import { getLiveblocksServer, normalizeUsername } from "@/lib/liveblocksServer";

function parseMembers(meta: any): string[] {
  const raw = String(meta?.members || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(_: Request, { params }: { params: { roomId: string } }) {
  const authed = await getAuthedUserFromCookies();
  if (!authed.ok) return authed.response;

  const liveblocks = getLiveblocksServer();
  const userId = normalizeUsername(authed.user.username);
  const roomId = String(params.roomId || "").trim();
  if (!roomId) return NextResponse.json({ error: "roomId is required" }, { status: 400 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info: any = await liveblocks.getRoom(roomId);
    const accesses = info?.usersAccesses || {};
    if (!accesses?.[userId]) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const meta = info?.metadata || {};
    return NextResponse.json({
      ok: true,
      data: {
        id: info.id,
        type: String(meta.type || "dm"),
        name: String(meta.name || "Conversation"),
        members: parseMembers(meta),
        updatedAt: info.updatedAt || info.createdAt || null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Not found" }, { status: 404 });
  }
}


