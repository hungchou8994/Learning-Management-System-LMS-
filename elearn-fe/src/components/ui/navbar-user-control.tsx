"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api";
import { User } from "lucide-react";

export default function NavbarUserControl() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUsername(data.data.user.username);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <div className="h-10 w-20 animate-pulse bg-gray-200 rounded"></div>;
  }

  if (!isAuthenticated) {
    return (
      <Link href="/sign-in" className="login-btn">
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        className="text-white hover:bg-white/10"
        onClick={handleLogout}
      >
        <User className="h-5 w-5 mr-2" />
        {username}
      </Button>
    </div>
  );
}
