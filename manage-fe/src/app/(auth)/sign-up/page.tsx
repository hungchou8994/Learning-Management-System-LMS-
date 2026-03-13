"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";

const SignUpPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Teacher self sign-up is deprecated. Teachers must apply and be approved by center staff.
    router.replace("/apply");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 text-white p-3 rounded-full">
              <GraduationCap className="h-8 w-8" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Đang chuyển hướng...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Đăng ký tài khoản giáo viên đã được thay bằng trang Apply.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2" />
              <span>
                Vui lòng dùng trang <strong>/apply</strong> để ứng tuyển.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
