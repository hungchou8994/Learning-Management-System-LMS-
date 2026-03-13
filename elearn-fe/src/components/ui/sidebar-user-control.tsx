"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Avatar } from "./avatar";

export default function SidebarUserControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "John Doe",
    role: "Student",
  });
  const router = useRouter();

  useEffect(() => {
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
      <motion.div
        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {userInfo.name}
          </p>
          <p className="text-xs text-white/60 truncate">{userInfo.role}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-white/60" />
        </motion.div>
      </motion.div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full left-0 mb-2 w-full bg-white/10 backdrop-blur-xl rounded-lg shadow-lg border border-white/20"
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
