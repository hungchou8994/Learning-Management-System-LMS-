"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllCoursesForCenter, type CenterCourse } from "@/lib/api";
import { useRoleGuard } from "@/lib/useRoleGuard";
import { formatUsd } from "@/lib/money";

export default function DashboardPage() {
  const { loading: authLoading } = useRoleGuard([
    "admin",
    "manager",
    "accountant",
    "recruiter",
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState<CenterCourse[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      const res = await getAllCoursesForCenter();
      if (!res.success || !res.data) {
        setError(res.error?.message || "Không thể tải dữ liệu dashboard.");
        setCourses([]);
        setLoading(false);
        return;
      }
      setCourses(res.data);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const totalStudents = courses.reduce(
      (s, c) => s + (c.totalStudents || 0),
      0
    );
    const totalRevenue = courses.reduce((s, c) => {
      const price =
        (typeof c.salePrice === "number" ? c.salePrice : c.originalPrice) || 0;
      return s + price * (c.totalStudents || 0);
    }, 0);
    const avgRating =
      totalCourses === 0
        ? 0
        : courses.reduce((s, c) => s + (c.rating || 0), 0) / totalCourses;

    return { totalCourses, totalStudents, totalRevenue, avgRating };
  }, [courses]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner h-14 w-14 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang tải dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-glass p-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Dashboard trung tâm
        </h1>
        <p className="text-gray-600">
          Tổng quan tình hình kinh doanh trung tâm: doanh thu (USD), số học
          sinh, chất lượng khóa học và mức độ tăng trưởng.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs text-gray-500">Tổng khóa học</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalCourses}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500">Tổng học sinh</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalStudents}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500">Doanh thu (ước tính)</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatUsd(stats.totalRevenue)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500">Đánh giá TB</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.avgRating.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Danh sách khóa học
        </h2>
        <div className="overflow-x-auto border rounded-2xl bg-white">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Tên</th>
                <th className="text-left p-3 border-b">Giá</th>
                <th className="text-left p-3 border-b">Học sinh</th>
                <th className="text-left p-3 border-b">Doanh thu</th>
                <th className="text-left p-3 border-b">Rating</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => {
                const price =
                  typeof c.salePrice === "number"
                    ? c.salePrice
                    : c.originalPrice;
                const revenue = price * (c.totalStudents || 0);
                return (
                  <tr key={c._id} className="align-top">
                    <td className="p-3 border-b">
                      <div className="font-semibold text-gray-900">
                        {c.name}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {c.description}
                      </div>
                    </td>
                    <td className="p-3 border-b">{formatUsd(price)}</td>
                    <td className="p-3 border-b">{c.totalStudents || 0}</td>
                    <td className="p-3 border-b font-semibold">
                      {formatUsd(revenue)}
                    </td>
                    <td className="p-3 border-b">
                      {(c.rating || 0).toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
