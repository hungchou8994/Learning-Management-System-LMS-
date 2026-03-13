import { NextResponse } from "next/server";
import { getAuthedUserFromCookies } from "@/lib/serverAuth";
import { getLiveblocksServer, makeDmRoomId, normalizeUsername } from "@/lib/liveblocksServer";

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
  const other = normalizeUsername(body?.otherUsername);
  const me = normalizeUsername(authed.user.username);
  if (!other) return NextResponse.json({ error: "otherUsername is required" }, { status: 400 });
  if (other === me) return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });

  const roomId = makeDmRoomId(me, other);
  const liveblocks = getLiveblocksServer();

  const members = [me, other];
  const metadata = {
    type: "dm",
    name: other,
    members: members.join(","),
  };

  const usersAccesses = usersAccessesFor(members);

  try {
    await liveblocks.createRoom(roomId, { defaultAccesses: [], metadata, usersAccesses });
  } catch (e: any) {
    // If already exists, ensure permissions are set (best-effort)
    try {
      await liveblocks.updateRoom(roomId, { metadata, usersAccesses });
    } catch {
      return NextResponse.json(
        { ok: false, error: e?.message || "Failed to create DM room" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, data: { roomId } });
}


