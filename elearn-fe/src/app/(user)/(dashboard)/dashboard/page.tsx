"use client";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import { useEffect } from "react";
import StudentDashboardArea from "@/dashboard/student-dashboard/student-dashboard/StudentDashboardArea";
import Wrapper from "@/layouts/Wrapper";

export default function DashboardPage() {
  useEffect(() => {
    // Check and create user profile if needed
    const checkUserProfile = async () => {
      try {
        // First, get the current user's info from auth service
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/auth/me`,
          {
            credentials: "include", // This will send the cookies
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!userResponse.ok) {
          console.error("Failed to get user info:", await userResponse.text());
          return;
        }

        // Then check if user profile exists in elearn-db
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/user/user`,
          {
            credentials: "include", // This will send the cookies
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // If profile doesn't exist (404), create it
        if (profileResponse.status === 404) {
          const createResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/user/register`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include", // This will send the cookies
              body: JSON.stringify({
                firstName: "",
                lastName: "",
                address: "",
                dob: "",
                bio: "",
                phoneNumber: "",
                avatarUrl: "",
                coverUrl: "",
                skill: "",
                socialShare: "", // Empty string is fine, backend will convert to empty array
              }),
            }
          );

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error("Failed to create user profile:", errorText);
          }
        } else if (!profileResponse.ok && profileResponse.status !== 404) {
          // Log other errors except 404
          const errorText = await profileResponse.text();
          console.error("Error checking profile:", errorText);
        }
      } catch (error) {
        console.error("Error checking/creating user profile:", error);
      }
    };

    checkUserProfile();
  }, []); // Run once when component mounts

  return <StudentDashboardArea />;
}
