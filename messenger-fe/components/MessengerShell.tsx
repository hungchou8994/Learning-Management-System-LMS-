"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMessengerAuth } from "@/providers/AuthProvider";
import { LogOut, MessageCirclePlus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import UsernameTagInput from "./UsernameTagInput";

type RoomSummary = {
  id: string;
  type: string;
  name: string;
  members: string[];
  updatedAt: string | null;
};

type UserProfile = {
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

function fullName(p: Pick<UserProfile, "firstName" | "lastName"> | null | undefined) {
  const first = String(p?.firstName || "").trim();
  const last = String(p?.lastName || "").trim();
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || "";
}

function initials(name: string) {
  const s = String(name || "").trim();
  if (!s) return "?";
  return s.slice(0, 2).toUpperCase();
}

export default function MessengerShell({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, logout } = useMessengerAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  const [profileMap, setProfileMap] = useState<Record<string, string>>({});

  const [showNewDm, setShowNewDm] = useState(false);
  const [dmMode, setDmMode] = useState<"name" | "username">("name");
  const [dmQuery, setDmQuery] = useState("");
  const [dmResults, setDmResults] = useState<UserProfile[]>([]);
  const [dmSearchBusy, setDmSearchBusy] = useState(false);
  const [dmSearchError, setDmSearchError] = useState("");
  const [dmBusy, setDmBusy] = useState(false);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [groupBusy, setGroupBusy] = useState(false);

  const refreshRooms = async () => {
    setLoadingRooms(true);
    setRoomsError("");
    try {
      const resp = await fetch("/api/rooms", { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.ok) {
        setRoomsError(data?.error || "Failed to load conversations");
        setRooms([]);
        return;
      }
      setRooms(Array.isArray(data.data) ? (data.data as RoomSummary[]) : []);
    } catch (e) {
      setRoomsError(e instanceof Error ? e.message : "Network error");
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  const myUsername = (user?.username || "").toLowerCase();

  useEffect(() => {
    const all = Array.from(
      new Set(
        rooms
          .flatMap((r) => r.members || [])
          .map((u) => String(u || "").trim().toLowerCase())
          .filter(Boolean)
      )
    );
    if (all.length === 0) {
      setProfileMap({});
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const resp = await fetch("/api/users/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: all }),
          cache: "no-store",
        });
        const data = await resp.json().catch(() => null);
        if (!resp.ok || !data?.ok) return;
        const arr: UserProfile[] = Array.isArray(data.data) ? data.data : [];
        const next: Record<string, string> = {};
        for (const p of arr) {
          const u = String(p?.username || "").trim().toLowerCase();
          if (!u) continue;
          const n = fullName(p);
          if (n) next[u] = n;
        }
        if (!cancelled) setProfileMap(next);
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [rooms]);

  const displayRooms = useMemo(() => {
    return rooms.map((r) => {
      if (r.type === "dm" && myUsername) {
        const other = r.members.find((m) => m !== myUsername);
        const otherLabel = other ? profileMap[other] || other : "";
        return { ...r, displayName: otherLabel || r.name, otherUsername: other || "" };
      }
      return { ...r, displayName: r.name, otherUsername: "" };
    });
  }, [rooms, myUsername, profileMap]);

  const startDmWith = async (otherUsername: string) => {
    const other = String(otherUsername || "").trim();
    if (!other) return;
    setDmBusy(true);
    const resp = await fetch("/api/rooms/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUsername: other }),
    });
    const data = await resp.json().catch(() => null);
    setDmBusy(false);
    if (resp.ok && data?.ok && data?.data?.roomId) {
      setShowNewDm(false);
      setDmQuery("");
      setDmResults([]);
      setDmSearchError("");
      await refreshRooms();
      router.push(`/messenger/${encodeURIComponent(data.data.roomId)}`);
    }
  };

  useEffect(() => {
    if (!showNewDm) return;

    const q = dmQuery.trim();
    setDmSearchError("");
    if (!q) {
      setDmResults([]);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      setDmSearchBusy(true);
      try {
        const resp = await fetch(
          `/api/users/search?q=${encodeURIComponent(q)}&mode=${encodeURIComponent(dmMode)}&limit=10`,
          { cache: "no-store" }
        );
        const data = await resp.json().catch(() => null);
        if (cancelled) return;
        if (!resp.ok || !data?.ok) {
          setDmSearchError(data?.error || "Không thể tìm người dùng");
          setDmResults([]);
          return;
        }
        const arr: UserProfile[] = Array.isArray(data.data) ? data.data : [];
        const filtered = arr.filter((u) => String(u.username || "").toLowerCase() !== myUsername);
        setDmResults(filtered);
      } catch (e) {
        if (!cancelled) {
          setDmSearchError(e instanceof Error ? e.message : "Network error");
          setDmResults([]);
        }
      } finally {
        if (!cancelled) setDmSearchBusy(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [dmQuery, dmMode, showNewDm, myUsername]);

  return (
    <div className="h-screen w-full">
      <div className="grid h-full grid-cols-[340px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-app-border bg-app-panel flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-app-border">
            <div>
              <div className="text-lg font-extrabold">Messenger</div>
              <div className="text-xs text-white/60">
                {isLoaded ? (user ? `@${user.username}` : "Not signed in") : "Loading..."}
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-app-border bg-white/5 p-2 hover:bg-white/10"
              title="Logout"
              onClick={async () => {
                await logout();
                router.push("/sign-in");
              }}
            >
              <LogOut size={18} />
            </button>
          </div>

          <div className="px-4 py-3 flex gap-2">
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-3 py-2 text-sm font-semibold hover:bg-brand-blue2"
              onClick={() => setShowNewDm(true)}
            >
              <MessageCirclePlus size={18} />
              New chat
            </button>
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-app-border bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10"
              onClick={() => setShowNewGroup(true)}
            >
              <UsersRound size={18} />
              New group
            </button>
          </div>

          <div className="px-4 pb-2">
            <div className="rounded-xl border border-app-border bg-app-panel2 px-3 py-2 text-sm text-white/60">
              {loadingRooms ? "Loading conversations..." : `${displayRooms.length} conversations`}
              {roomsError ? <div className="mt-1 text-xs text-red-300">{roomsError}</div> : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {displayRooms.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => router.push(`/messenger/${encodeURIComponent(r.id)}`)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5 text-left"
              >
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                  {initials(r.displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate font-semibold">{r.displayName}</div>
                    <div className="text-[11px] text-white/40">{r.type === "group" ? "Group" : "DM"}</div>
                  </div>
                  <div className="truncate text-xs text-white/50">
                    {r.type === "dm" && r.otherUsername ? `@${r.otherUsername}` : r.members.length > 0 ? r.members.map((u) => profileMap[u] || u).join(", ") : "—"}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-app-border px-4 py-3 text-xs text-white/50">
            Powered by Liveblocks (no extra chat server)
          </div>
        </aside>

        {/* Main */}
        <main className="bg-app-bg">{children}</main>

        {/* DM modal */}
        {showNewDm && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close"
              onClick={() => setShowNewDm(false)}
            />
            <div className="absolute left-1/2 top-1/2 w-[520px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-app-border bg-app-panel p-5 shadow-2xl">
              <div className="text-lg font-bold">New chat</div>
              <div className="mt-1 text-sm text-white/60">Tìm người để bắt đầu cuộc trò chuyện.</div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={
                      dmMode === "name"
                        ? "rounded-xl bg-white/10 border border-white/10 px-3 py-1.5 text-sm font-semibold"
                        : "rounded-xl border border-app-border bg-white/5 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                    }
                    onClick={() => setDmMode("name")}
                  >
                    Theo tên
                  </button>
                  <button
                    type="button"
                    className={
                      dmMode === "username"
                        ? "rounded-xl bg-white/10 border border-white/10 px-3 py-1.5 text-sm font-semibold"
                        : "rounded-xl border border-app-border bg-white/5 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                    }
                    onClick={() => setDmMode("username")}
                  >
                    Theo username
                  </button>
                </div>

                <input
                  value={dmQuery}
                  onChange={(e) => setDmQuery(e.target.value)}
                  className="w-full rounded-xl bg-app-panel2 border border-app-border px-3 py-2 outline-none focus:border-brand-blue"
                  placeholder={dmMode === "username" ? "teacher_01" : "Ngọc Trần"}
                />

                {dmSearchError ? <div className="text-xs text-red-300">{dmSearchError}</div> : null}

                <div className="max-h-[240px] overflow-y-auto rounded-xl border border-app-border bg-app-panel2">
                  {dmSearchBusy ? (
                    <div className="px-3 py-3 text-sm text-white/60">Đang tìm...</div>
                  ) : dmResults.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-white/50">Không có kết quả.</div>
                  ) : (
                    dmResults.map((u) => {
                      const uname = String(u.username || "").toLowerCase();
                      const name = fullName(u) || uname;
                      return (
                        <button
                          key={uname}
                          type="button"
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-left"
                          onClick={() => startDmWith(uname)}
                        >
                          <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center font-bold">
                            {initials(name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold">{name}</div>
                            <div className="truncate text-xs text-white/50">@{uname}</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-app-border bg-white/5 px-4 py-2 hover:bg-white/10"
                  onClick={() => setShowNewDm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={dmBusy}
                  className="rounded-xl bg-brand-blue px-4 py-2 font-semibold hover:bg-brand-blue2 disabled:opacity-60"
                  onClick={async () => {
                    if (dmMode !== "username") return;
                    const otherUsername = dmQuery.trim();
                    if (!otherUsername) return;
                    await startDmWith(otherUsername);
                  }}
                >
                  {dmBusy ? "Creating..." : dmMode === "username" ? "Start" : "Chọn người ở danh sách"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Group modal */}
        {showNewGroup && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close"
              onClick={() => setShowNewGroup(false)}
            />
            <div className="absolute left-1/2 top-1/2 w-[640px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-app-border bg-app-panel p-5 shadow-2xl">
              <div className="text-lg font-bold">New group</div>
              <div className="mt-1 text-sm text-white/60">Create a group conversation (WhatsApp-style).</div>

              <div className="mt-4 space-y-2">
                <div className="text-xs text-white/70">Group name</div>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full rounded-xl bg-app-panel2 border border-app-border px-3 py-2 outline-none focus:border-brand-blue"
                  placeholder="Project DA2"
                />
              </div>

              <div className="mt-4">
                <UsernameTagInput
                  label="Members (usernames)"
                  value={groupMembers}
                  onChange={setGroupMembers}
                  placeholder="Add username and press Enter…"
                />
                <div className="mt-2 text-xs text-white/50">
                  You will be added automatically.
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-app-border bg-white/5 px-4 py-2 hover:bg-white/10"
                  onClick={() => setShowNewGroup(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={groupBusy}
                  className="rounded-xl bg-brand-blue px-4 py-2 font-semibold hover:bg-brand-blue2 disabled:opacity-60"
                  onClick={async () => {
                    const name = groupName.trim();
                    if (!name) return;
                    setGroupBusy(true);
                    const resp = await fetch("/api/rooms/group", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name, members: groupMembers }),
                    });
                    const data = await resp.json().catch(() => null);
                    setGroupBusy(false);
                    if (resp.ok && data?.ok && data?.data?.roomId) {
                      setShowNewGroup(false);
                      setGroupName("");
                      setGroupMembers([]);
                      await refreshRooms();
                      router.push(`/messenger/${encodeURIComponent(data.data.roomId)}`);
                    }
                  }}
                >
                  {groupBusy ? "Creating..." : "Create group"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


