import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MessengerAuthProvider from "@/providers/AuthProvider";
import LiveblocksClientProvider from "@/providers/LiveblocksClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkillGro Messenger",
  description: "Internal messenger powered by Liveblocks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} text-white`}>
        <MessengerAuthProvider>
          <LiveblocksClientProvider>{children}</LiveblocksClientProvider>
        </MessengerAuthProvider>
      </body>
    </html>
  );
}


