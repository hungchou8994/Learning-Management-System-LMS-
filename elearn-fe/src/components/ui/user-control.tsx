"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./button";

export default function UserControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if auth_token cookie exists
    const checkAuth = () => {
      const cookies = document.cookie.split(";");
      const hasAuthToken = cookies.some((cookie) =>
        cookie.trim().startsWith("auth_token=")
      );
      setIsLoggedIn(hasAuthToken);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    // Clear the auth_token cookie
    document.cookie =
      "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setIsLoggedIn(false);
    router.push("/sign-in");
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 text-white hover:text-white/80"
        onClick={() => setIsOpen(!isOpen)}
      >
        <User className="h-4 w-4" />
        <span>User Menu</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </Button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl rounded-lg shadow-lg border border-white/20"
        >
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white hover:text-white/80"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
