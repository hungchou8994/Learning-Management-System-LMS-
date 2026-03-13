"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ClientSideSuspense, RoomProvider, useMutation, useOthers, useSelf, useStorage } from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";
import { Image as ImageIcon, SendHorizonal, Users } from "lucide-react";

type TextMessage = {
  id: string;
  sender: string;
  createdAt: number;
  kind: "text";
  text: string;
};

type ImageMessage = {
  id: string;
  sender: string;
  createdAt: number;
  kind: "image";
  imageDataUrl: string;
  fileName?: string;
};

type Message = TextMessage | ImageMessage;

type RoomInfo = {
  id: string;
  type: string;
  name: string;
  members: string[];
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

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initialStorage() {
  return {
    messages: new LiveList<Message>([]),
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function ChatInner({ roomId }: { roomId: string }) {
  const self = useSelf();
  const others = useOthers();
  const [text, setText] = useState("");
  const [info, setInfo] = useState<RoomInfo | null>(null);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const myId = String(self?.id || "").toLowerCase();

  // NOTE: useStorage selector receives an immutable snapshot of Storage.
  // Since Storage contains a LiveList, the snapshot value here is a plain array.
  const messages = useStorage((root) => (root as any)?.messages as Message[] | undefined);

  useEffect(() => {
    const run = async () => {
      const resp = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, { cache: "no-store" });
      const data = await resp.json().catch(() => null);
      if (resp.ok && data?.ok) setInfo(data.data as RoomInfo);
    };
    run();
  }, [roomId]);

  useEffect(() => {
    const members = Array.from(
      new Set((info?.members || []).map((u) => String(u || "").trim().toLowerCase()).filter(Boolean))
    );
    if (members.length === 0) {
      setProfileMap({});
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const resp = await fetch("/api/users/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: members }),
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
  }, [info?.members]);

  const roomTitle = useMemo(() => {
    if (!info) return "Conversation";
    if (info.type !== "dm") return info.name || "Conversation";
    // For DM, metadata.name is the other username.
    const other = String(info.name || "").trim().toLowerCase();
    return profileMap[other] || other || "Conversation";
  }, [info, profileMap]);

  const membersLabel = useMemo(() => {
    const members = info?.members || [];
    if (!members.length) return "";
    return members.map((u) => profileMap[String(u || "").toLowerCase()] || u).join(", ");
  }, [info?.members, profileMap]);

  const sortedMessages: Message[] = useMemo(() => {
    const arr = messages || [];
    return [...arr].sort((a, b) => a.createdAt - b.createdAt);
  }, [messages]);

  const sendMessage = useMutation(({ storage }, payload: { text: string }) => {
    const t = payload.text.trim();
    if (!t) return;
    const list = storage.get("messages") as LiveList<Message>;
    list.push({
      id: crypto.randomUUID(),
      sender: myId,
      createdAt: Date.now(),
      kind: "text",
      text: t,
    });
  }, [myId]);

  const sendImage = useMutation(({ storage }, payload: { imageDataUrl: string; fileName?: string }) => {
    const url = String(payload.imageDataUrl || "").trim();
    if (!url) return;
    const list = storage.get("messages") as LiveList<Message>;
    list.push({
      id: crypto.randomUUID(),
      sender: myId,
      createdAt: Date.now(),
      kind: "image",
      imageDataUrl: url,
      fileName: payload.fileName,
    });
  }, [myId]);

  const sendTextNow = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage({ text: t });
    setText("");
  };

  const sendImageFile = async (file: File) => {
    // Keep images reasonably small since Liveblocks Storage isn't meant as a file store.
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      alert(`Image is too large (${Math.round(file.size / 1024 / 1024)}MB). Please upload an image under 2MB.`);
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    sendImage({ imageDataUrl: dataUrl, fileName: file.name });
  };

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 border-b border-app-border bg-app-panel flex items-center justify-between px-5">
        <div className="min-w-0">
          <div className="truncate font-bold">{roomTitle}</div>
          <div className="text-xs text-white/60 truncate">
            <span className="inline-flex items-center gap-1">
              <Users size={14} />
              {1 + others.length} online
            </span>
            {info?.type === "group" && info.members?.length ? (
              <span className="ml-2">
                • {membersLabel}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {sortedMessages.length === 0 ? (
          <div className="mt-10 text-center text-sm text-white/60">
            No messages yet. Say hi.
          </div>
        ) : (
          sortedMessages.map((m) => {
            const mine = String(m.sender || "").toLowerCase() === myId;
            const senderId = String(m.sender || "").toLowerCase();
            const senderName = profileMap[senderId] || senderId;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div className={mine ? "max-w-[72%] flex flex-col items-end" : "max-w-[72%] flex flex-col items-start"}>
                  {!mine ? (
                    <div className="text-[11px] text-white/40 mb-0.5">{senderName}</div>
                  ) : null}
                  {m.kind === "text" ? (
                    <div
                      className={
                        mine
                          ? "rounded-2xl rounded-br-md bg-brand-blue px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words"
                          : "rounded-2xl rounded-bl-md bg-white/10 px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words"
                      }
                    >
                      {m.text}
                    </div>
                  ) : (
                    <a
                      href={m.imageDataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={
                        mine
                          ? "rounded-2xl rounded-br-md bg-brand-blue/20 p-1 overflow-hidden"
                          : "rounded-2xl rounded-bl-md bg-white/10 p-1 overflow-hidden"
                      }
                      title={m.fileName || "Open image"}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.imageDataUrl}
                        alt={m.fileName || "Image"}
                        className="block max-w-[320px] w-full h-auto rounded-xl"
                      />
                    </a>
                  )}
                  <div className="mt-0.5 text-[11px] text-white/35">{formatTime(m.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className="border-t border-app-border bg-app-panel px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          sendTextNow();
        }}
      >
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              for (const f of files) {
                await sendImageFile(f);
              }
              // allow selecting the same file again
              e.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            className="shrink-0 rounded-2xl bg-app-panel2 border border-app-border px-3 py-2 text-white/80 hover:text-white hover:border-white/20"
            aria-label="Upload image"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={18} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendTextNow();
              }
            }}
            onPaste={async (e) => {
              const items = Array.from(e.clipboardData?.items || []);
              const imageFiles: File[] = items
                .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
                .map((it) => it.getAsFile())
                .filter((f): f is File => Boolean(f));

              if (imageFiles.length === 0) return;

              // We want pasted images to be sent as separate messages.
              e.preventDefault();

              const pastedText = e.clipboardData?.getData("text/plain");
              if (pastedText) setText((prev) => prev + pastedText);

              for (const f of imageFiles) {
                await sendImageFile(f);
              }
            }}
            className="flex-1 resize-none rounded-2xl bg-app-panel2 border border-app-border px-4 py-2 text-sm outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            className="rounded-2xl bg-brand-blue px-4 py-2 font-semibold hover:bg-brand-blue2"
            aria-label="Send"
          >
            <SendHorizonal size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ChatRoom({ roomId }: { roomId: string }) {
  return (
    <RoomProvider id={roomId} initialStorage={initialStorage()}>
      <ClientSideSuspense
        fallback={
          <div className="h-full flex items-center justify-center text-white/60">
            Loading chat...
          </div>
        }
      >
        {() => <ChatInner roomId={roomId} />}
      </ClientSideSuspense>
    </RoomProvider>
  );
}


