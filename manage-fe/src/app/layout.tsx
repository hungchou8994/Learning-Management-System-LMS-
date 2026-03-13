import type { Metadata } from "next";
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navigation } from "@/components/Navigation";
// import "tailwindcss/tailwind.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillGro Dashboard - Nền tảng quản lý khóa học",
  description:
    "Dashboard dành cho giáo viên quản lý khóa học và học viên trên SkillGro",
  keywords: ["SkillGro", "giáo dục", "khóa học", "quản lý", "dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased font-sans bg-gradient-to-br from-indigo-50 via-white to-cyan-50 min-h-screen"
        suppressHydrationWarning
      >
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="relative z-10">
          {/* Content Container */}
          <div className="container mx-auto px-4 py-8 max-w-[90vw]">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
