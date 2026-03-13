import { NextResponse } from "next/server";
import { getAuthedUserFromCookies } from "@/lib/serverAuth";
import { getLiveblocksServer, normalizeUsername } from "@/lib/liveblocksServer";

type RoomItem = {
  id: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

function parseMembers(meta: any): string[] {
  const raw = String(meta?.members || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  const authed = await getAuthedUserFromCookies();
  if (!authed.ok) return authed.response;

  const liveblocks = getLiveblocksServer();
  const userId = normalizeUsername(authed.user.username);

  let rooms: RoomItem[] = [];
  try {
    // Some SDK versions support filtering by userId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await (liveblocks as any).getRooms?.({ userId });
    rooms = (res?.data || res || []) as RoomItem[];
  } catch {
    // Fallback: list all rooms and filter by usersAccesses if present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await (liveblocks as any).getRooms?.();
    const all = (res?.data || res || []) as any[];
    rooms = all
      .filter((r) => {
        const acc = r?.usersAccesses || {};
        return !!acc?.[userId];
      })
      .map((r) => ({ id: r.id, metadata: r.metadata, createdAt: r.createdAt, updatedAt: r.updatedAt }));
  }

  const summaries = rooms
    .map((r) => {
      const meta = r.metadata || {};
      return {
        id: r.id,
        type: String(meta.type || "dm"),
        name: String(meta.name || "Conversation"),
        members: parseMembers(meta),
        updatedAt: r.updatedAt || r.createdAt || null,
      };
    })
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

  return NextResponse.json({ ok: true, data: summaries });
}


