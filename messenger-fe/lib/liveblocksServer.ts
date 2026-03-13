import { Liveblocks } from "@liveblocks/node";

export function getLiveblocksServer() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing LIVEBLOCKS_SECRET_KEY");
  }
  return new Liveblocks({ secret });
}

export function normalizeUsername(u: string) {
  return String(u || "").trim().toLowerCase();
}

export function makeDmRoomId(a: string, b: string) {
  const x = normalizeUsername(a);
  const y = normalizeUsername(b);
  const [p, q] = x < y ? [x, y] : [y, x];
  // Use a conservative roomId format (avoid ":" which some systems reject).
  return `dm__${p}__${q}`;
}

export function makeGroupRoomId(uuid: string) {
  // Use a conservative roomId format (avoid ":" which some systems reject).
  return `grp__${uuid}`;
}


