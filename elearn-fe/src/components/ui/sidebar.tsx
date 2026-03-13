"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminMenu, teacherMenu, studentMenu } from "@/constants/menu";
export function Sidebar() {
  const { data: session } = useSession();
  const [activeItem, setActiveItem] = useState("Dashboard");

  const menuItems = {
    ADMIN: adminMenu,
    TEACHER: teacherMenu,
    STUDENT: studentMenu,
  }[session?.user?.role || "STUDENT"];

  const handleSignOut = () => signOut({ callbackUrl: "/sign-in" });

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
              <span className="text-lg text-white font-bold">B</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-gray-900">
                BaouU
              </span>
              <span className="text-xs font-medium text-gray-500">
                Learning Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link key={item.title} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    activeItem === item.title
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setActiveItem(item.title)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 mt-auto border-t">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {session?.user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
