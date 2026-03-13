"use client";

import React from "react";
import { LiveblocksProvider } from "@liveblocks/react";

export default function LiveblocksClientProvider({ children }: { children: React.ReactNode }) {
  return <LiveblocksProvider authEndpoint="/api/liveblocks-auth">{children}</LiveblocksProvider>;
}


