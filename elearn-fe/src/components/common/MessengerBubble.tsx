"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import styles from "./MessengerBubble.module.scss";

function ensureHttp(url: string) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("localhost")) return `http://${trimmed}`;
  return trimmed;
}

export default function MessengerBubble() {
  const href = ensureHttp(process.env.NEXT_PUBLIC_MESSENGER_URL || "http://localhost:3008/messenger");

  return (
    <div className={styles.wrap}>
      <div className={styles.pulse} aria-hidden="true" />
      <Link
        className={styles.btn}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Messenger"
        title="Messenger"
      >
        <MessagesSquare size={22} />
      </Link>
    </div>
  );
}


