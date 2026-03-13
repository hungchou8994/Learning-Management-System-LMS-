"use client";

import { useEffect } from "react";
import { useAuth } from "@/providers/AuthContext";

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "mousemove",
  "scroll",
  "touchstart",
];

export function SessionTimer() {
  const { refreshAccessToken, signOut } = useAuth();

  useEffect(() => {
    let lastActivity = Date.now();
    let refreshInterval: NodeJS.Timeout;

    // Function to refresh the token
    const refreshToken = async () => {
      // Only refresh if there was activity in the last interval
      if (Date.now() - lastActivity < REFRESH_INTERVAL) {
        const success = await refreshAccessToken();
        if (!success) {
          signOut();
        }
      }
    };

    // Update last activity time
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Start the refresh interval
    refreshInterval = setInterval(refreshToken, REFRESH_INTERVAL);

    // Add activity event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Initial activity timestamp
    updateActivity();

    // Cleanup function
    return () => {
      clearInterval(refreshInterval);
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [refreshAccessToken, signOut]);

  return null;
}
