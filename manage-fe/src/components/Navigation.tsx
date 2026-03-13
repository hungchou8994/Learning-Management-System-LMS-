"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  Settings,
  User,
  LogOut,
  GraduationCap,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { logout } from "@/lib/api";
import { useState, useEffect } from "react";
import { getAuthMe, getUserInfo } from "@/lib/api";

const navigationItems = [
  {
    name: "Khóa học",
    href: "/courses",
    icon: BookOpen,
    description: "Quản lý khóa học",
  },
  {
    name: "Giáo án AI",
    href: "/ai-lesson-plan",
    icon: Sparkles,
    description: "Soạn kế hoạch bài dạy bằng AI",
  },
  {
    name: "Chấm điểm",
    href: "/grading",
    icon: ClipboardList,
    description: "Chấm điểm & đánh giá",
  },
  {
    name: "Problems",
    href: "/programming/problemset/create",
    icon: Code,
    description: "Tạo bài tập lập trình",
  },
  {
    name: "Học viên",
    href: "/students",
    icon: Users,
    description: "Quản lý học viên",
  },
  {
    name: "Cài đặt",
    href: "/settings",
    icon: Settings,
    description: "Cài đặt hệ thống",
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    username?: string;
    firstName?: string;
    email?: string;
  } | null>(null);

  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  // Lấy thông tin user khi component mount
  useEffect(() => {
    if (isAuthPage) return;
    const fetchUserInfo = async () => {
      try {
        const [profile, auth] = await Promise.all([getUserInfo(), getAuthMe()]);
        const next = {
          username: profile.success ? profile.data?.username : undefined,
          firstName: profile.success ? profile.data?.firstName : undefined,
          email: auth.success ? auth.data?.email : undefined,
        };
        setUserInfo(next);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    fetchUserInfo();
  }, [isAuthPage]);

  // Do not render dashboard navigation on auth pages
  if (isAuthPage) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await logout();
      if (response.success) {
        router.push("/sign-in");
      } else {
        console.error("Logout failed");
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/sign-in");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo và tên */}
          <div className="flex items-center space-x-4">
            <Link href="/courses" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold gradient-text">
                  SkillGro
                </span>
                <span className="text-xs text-gray-500 -mt-1">Dashboard</span>
              </div>
            </Link>
          </div>

          {/* Menu chính */}
          <div className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    "group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl"></div>
                  )}
                  <Icon
                    className={clsx(
                      "h-4 w-4 relative z-10 transition-colors",
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 group-hover:text-gray-700"
                    )}
                  />
                  <span className="relative z-10">{item.name}</span>

                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.description}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-3 px-4 py-2 rounded-xl bg-gray-50/80 backdrop-blur-sm border border-gray-200/50">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {userInfo?.firstName || userInfo?.username || "Giảng viên"}
                </span>
                <span className="text-xs text-gray-500">
                  {userInfo?.email || "teacher@skillgro.com"}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="group flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 border border-red-200/50 hover:border-red-300"
            >
              <LogOut className="h-4 w-4 group-hover:animate-pulse" />
              <span className="hidden sm:inline">
                {isLoggingOut ? "Đang xuất..." : "Đăng xuất"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
