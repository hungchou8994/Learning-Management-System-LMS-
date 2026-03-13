"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BreadcrumbOne from "@/components/common/breadcrumb/BreadcrumbOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import LoginArea from "@/components/inner-pages/login/LoginArea";
import FooterOne from "@/layouts/footers/FooterOne";
import Wrapper from "@/layouts/Wrapper";
import { login } from "@/lib/api";

// export const metadata = {
//   title: "Sign In - SkillGro",
// };

const SignInPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    const accessToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1];

    if (accessToken) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await login(username, password);
      console.log("Login response:", response);

      if (response.success) {
        // Since cookies are httpOnly, we can't check them directly
        // Instead, we'll rely on the success response and redirect
        router.push("/dashboard");
      } else {
        setError(response.error?.message || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <HeaderOne />
      <main className="main-area fix">
        <BreadcrumbOne title="Student Login" sub_title="Login" />
        <LoginArea onLogin={handleLogin} isLoading={isLoading} error={error} />
      </main>
      <FooterOne />
    </Wrapper>
  );
};

export default SignInPage;
