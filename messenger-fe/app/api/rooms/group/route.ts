import { NextResponse } from "next/server";
import { getAuthedUserFromCookies } from "@/lib/serverAuth";
import { getLiveblocksServer, makeGroupRoomId, normalizeUsername } from "@/lib/liveblocksServer";

function usersAccessesFor(usernames: string[]) {
  // Use a narrow permission type that is compatible with BOTH createRoom and updateRoom types.
  const map: Record<string, ["room:write"]> = {};
  usernames.forEach((u) => {
    const id = normalizeUsername(u);
    if (!id) return;
    map[id] = ["room:write"];
  });
  return map;
}

export async function POST(req: Request) {
  const authed = await getAuthedUserFromCookies();
  if (!authed.ok) return authed.response;

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const incoming = Array.isArray(body?.members) ? body.members : [];

  const me = normalizeUsername(authed.user.username);
  const members = Array.from(
    new Set([me, ...incoming.map(normalizeUsername)].filter(Boolean))
  );

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (members.length < 2) {
    return NextResponse.json({ error: "At least 2 members (including you) are required" }, { status: 400 });
  }

  const roomId = makeGroupRoomId(crypto.randomUUID());
  const liveblocks = getLiveblocksServer();

  const metadata = {
    type: "group",
    name,
    members: members.join(","),
  };

  const usersAccesses = usersAccessesFor(members);

  await liveblocks.createRoom(roomId, { defaultAccesses: [], metadata, usersAccesses });

  return NextResponse.json({ ok: true, data: { roomId } });
}


