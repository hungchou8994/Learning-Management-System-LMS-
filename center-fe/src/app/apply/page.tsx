"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApplyPage() {
  const router = useRouter();

  useEffect(() => {
    // Teacher applications live on manage-fe (teacher portal).
    router.replace("http://localhost:3005/apply");
  }, [router]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card-glass p-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Đang chuyển hướng...
        </h1>
        <p className="text-gray-600">
          Trang Apply dành cho giáo viên đã được chuyển sang portal giáo viên.
        </p>
        <div className="mt-4">
          <Link href="/sign-in" className="btn btn-ghost">
            Dành cho quản lý? Đi tới trang Sign-in
          </Link>
        </div>
      </div>
    </div>
  );
}
