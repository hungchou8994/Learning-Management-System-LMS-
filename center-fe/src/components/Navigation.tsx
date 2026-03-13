"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  LogOut,
  GraduationCap,
  LayoutDashboard,
  UsersRound,
  UserCheck,
  Wallet,
  Shield,
} from "lucide-react";
import { clsx } from "clsx";
import { logout } from "@/lib/api";
import { useState, useEffect } from "react";
import { getAuthMe } from "@/lib/api";
import type React from "react";

type CenterRole = "admin" | "manager" | "recruiter" | "accountant";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  roles: CenterRole[];
};

const navigationItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Doanh thu & tổng quan",
    roles: ["admin", "manager", "recruiter", "accountant"],
  },
  {
    name: "Giáo viên",
    href: "/teacher",
    icon: UserCheck,
    description: "Giáo viên & đơn ứng tuyển",
    roles: ["admin", "manager", "recruiter"],
  },
  {
    name: "Học sinh",
    href: "/student",
    icon: UsersRound,
    description: "Danh sách học sinh",
    roles: ["admin", "manager"],
  },
  {
    name: "Tài chính",
    href: "/finance",
    icon: Wallet,
    description: "Đối soát & báo cáo",
    roles: ["admin", "manager", "accountant"],
  },
  {
    name: "Nhân sự",
    href: "/staff",
    icon: Shield,
    description: "Admin quản lý tài khoản nội bộ",
    roles: ["admin"],
  },
  {
    name: "Quản lý",
    href: "/management",
    icon: LayoutDashboard,
    description: "Công cụ đồng bộ & xử lý sai lệch dữ liệu",
    roles: ["admin"],
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    username?: string;
    email?: string;
    role?: CenterRole;
  } | null>(null);

  const isAuthPage =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/secret");

  // Lấy thông tin user khi component mount
  useEffect(() => {
    if (isAuthPage) return;
    const fetchUserInfo = async () => {
      try {
        const next = {
          username: undefined as string | undefined,
          email: undefined as string | undefined,
          role: undefined as CenterRole | undefined,
        };

        const auth = await getAuthMe();
        if (auth.success) {
          next.username = auth.data?.username;
          next.email = auth.data?.email;
          next.role = auth.data?.role as CenterRole;
        }

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
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 group"
            >
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
                <span className="text-xs text-gray-500 -mt-1">Center</span>
              </div>
            </Link>
          </div>

          {/* Menu chính */}
          <div className="hidden md:flex items-center space-x-2">
            {navigationItems
              .filter((item) =>
                userInfo?.role ? item.roles.includes(userInfo.role) : true
              )
              .map((item) => {
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
                  {userInfo?.username || "Quản lý"}
                </span>
                <span className="text-xs text-gray-500">
                  {userInfo?.email || "manager@skillgro.com"}
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
