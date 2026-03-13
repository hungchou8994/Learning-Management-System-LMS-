"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { SessionTimer } from "@/components/ui/session-timer";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthState: (user: User | null, isAuthenticated: boolean) => void;
  signOut: () => void;
  fetchUserData: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);
  const initialCheckDone = useRef(false);

  const setAuthState = useCallback(
    (user: User | null, isAuthenticated: boolean) => {
      setUser(user);
      setIsAuthenticated(isAuthenticated);
      setIsLoading(false);
    },
    []
  );

  const signOut = async () => {
    try {
      // Call the logout endpoint
      await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Update state
      setAuthState(null, false);

      // Redirect to login
      router.push("/sign-in");
    } catch (error) {
      console.error("Error during logout:", error);

      // Fallback
      setAuthState(null, false);
      router.push("/sign-in");
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      console.log("Attempting to refresh access token...");

      const response = await fetch("http://localhost:3000/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      // If network error, server down, etc.
      if (!response) {
        console.error("No response from refresh token endpoint");
        return false;
      }

      // Parse response only if status is OK
      if (response.ok) {
        const data = await response.json();
        console.log("Token refresh response:", data);

        if (data.status === "success") {
          console.log("Access token refreshed successfully");
          return true;
        }
      } else {
        const errorData = await response.text();
        console.error("Token refresh failed:", response.status, errorData);
      }

      return false;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      return false;
    }
  };

  const fetchUserData = async () => {
    // Prevent duplicate calls and implement debouncing
    const now = Date.now();
    if (fetchInProgress.current) {
      console.log("User data fetch already in progress, skipping");
      return;
    }

    // Don't fetch more than once every 5 seconds unless it's the initial fetch
    if (!initialCheckDone.current && now - lastFetchTime.current < 5000) {
      console.log("User data fetch throttled, skipping");
      return;
    }

    fetchInProgress.current = true;
    lastFetchTime.current = now;
    setIsLoading(true);

    try {
      console.log("Fetching user data...");

      const response = await fetch("http://localhost:3000/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      // If token expired (401)
      if (response.status === 401) {
        console.log("Access token expired, attempting to refresh...");

        const refreshSuccessful = await refreshAccessToken();

        if (refreshSuccessful) {
          // Token refreshed, try fetching user data again after a short delay
          console.log("Retrying user data fetch with new token");

          // Add small delay to ensure cookies are set properly
          await new Promise((resolve) => setTimeout(resolve, 100));

          const retryResponse = await fetch(
            "http://localhost:3000/api/auth/me",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (retryResponse.ok) {
            const userData = await retryResponse.json();

            if (userData.status === "success" && userData.user) {
              console.log("User data retrieved after token refresh");
              setAuthState(userData.user, true);
              initialCheckDone.current = true;
              return;
            }
          } else {
            // Even after refresh, still can't get user data
            console.error(
              "Failed to get user data after token refresh:",
              await retryResponse.text()
            );
            setAuthState(null, false);
          }
        } else {
          console.error("Failed to refresh token");
          setAuthState(null, false);
        }
      } else if (response.ok) {
        // Successful fetch
        const data = await response.json();

        if (data.status === "success" && data.user) {
          console.log("User data retrieved successfully:", data.user);
          setAuthState(data.user, true);
          initialCheckDone.current = true;
          return;
        } else {
          console.warn("Invalid user data format:", data);
          setAuthState(null, false);
        }
      } else {
        // Other error status
        const errorText = await response.text();
        console.error(
          `Error fetching user data: ${response.status}`,
          errorText
        );
        setAuthState(null, false);
      }
    } catch (error) {
      console.error("Exception fetching user data:", error);
      setAuthState(null, false);
    } finally {
      fetchInProgress.current = false;
      setIsLoading(false);
      initialCheckDone.current = true;
    }
  };

  // Check auth on initial load - only once with a small delay to ensure cookies are set
  useEffect(() => {
    const checkAuth = async () => {
      console.log("AuthProvider mounted, checking authentication...");
      if (!initialCheckDone.current) {
        // Add a small delay before initial auth check to ensure cookies are properly set
        await new Promise((resolve) => setTimeout(resolve, 300));
        fetchUserData();
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        setAuthState,
        signOut,
        fetchUserData,
        refreshAccessToken,
      }}
    >
      {children}
      {isAuthenticated && <SessionTimer />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
