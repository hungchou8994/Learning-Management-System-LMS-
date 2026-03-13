"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BreadcrumbOne from "@/components/common/breadcrumb/BreadcrumbOne";
import RegistrationArea from "@/components/inner-pages/registration/RegistrationArea";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import { register } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/config";

const SignUpPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is already logged in by making an API request
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        const data = await response.json();

        // Only redirect if we get a successful response with user data
        if (response.ok && data.user) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    checkAuth();
  }, [router]);

  const handleRegister = async (
    username: string,
    email: string,
    password: string
  ) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await register(username, email, password);

      if (response.success) {
        // Create user profile in the Elearn-db database
        // try {
        //   // Get the token from cookies
        //   const cookies = document.cookie.split(";");
        //   const accessTokenCookie = cookies.find((cookie) =>
        //     cookie.trim().startsWith("access_token=")
        //   );
        //   const token = accessTokenCookie
        //     ? accessTokenCookie.split("=")[1].trim()
        //     : null;

        //   if (!token) {
        //     console.error("No access token found in cookies");
        //     setError("Authentication error. Please try logging in again.");
        //     return;
        //   }

        //   const createUserResponse = await fetch(
        //     `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/user/register`,
        //     {
        //       method: "POST",
        //       headers: {
        //         "Content-Type": "application/json",
        //         // Include token in both Authorization header and cookies
        //         Authorization: `Bearer ${token}`,
        //       },
        //       credentials: "include", // This will send the cookies
        //       body: JSON.stringify({
        //         firstName: "", // These can be updated later in the profile
        //         lastName: "",
        //         address: "",
        //         dob: "",
        //         bio: "",
        //         phoneNumber: "",
        //         avatarUrl: "",
        //         coverUrl: "",
        //         skill: "",
        //         socialShare: [],
        //       }),
        //     }
        //   );

        //   if (!createUserResponse.ok) {
        //     const errorText = await createUserResponse.text();
        //     console.error("Failed to create user profile:", errorText);
        //     setError(
        //       "Account created but failed to set up profile. Please try setting up your profile later."
        //     );
        //   }
        // } catch (profileErr) {
        //   console.error("Error creating user profile:", profileErr);
        //   setError(
        //     "Account created but failed to set up profile. Please try setting up your profile later."
        //   );
        // }

        // Redirect to dashboard even if profile creation fails
        router.push("/dashboard");
      } else {
        setError(response.error?.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <HeaderOne />
      <main className="main-area fix">
        <BreadcrumbOne title="Student SignUp" sub_title="SignUp" />
        <RegistrationArea
          onRegister={handleRegister}
          isLoading={isLoading}
          error={error}
        />
      </main>
      <FooterOne />
    </Wrapper>
  );
};

export default SignUpPage;
