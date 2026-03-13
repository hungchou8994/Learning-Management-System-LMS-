"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  FileText,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { getInstructorCoursesWithGradingStats } from "@/lib/api";

interface Course {
  _id: string;
  name: string;
  description: string;
  tag: string; // Backend uses 'tag' not 'category'
  level: number; // Backend uses number not string
  originalPrice: number;
  salePrice?: number;
  instructorId: string;
  rating: number;
  totalStudents: number; // Backend uses 'totalStudents' not 'students_count'
  thumbnail?: string;
  certificate: boolean; // Backend uses 'certificate' not 'is_certificate'
  createdAt: string;
  updatedAt: string;
  gradingStats?: {
    totalSessions: number;
    totalAssignments: number;
    totalAttempts: number;
    pendingAttempts: number;
    gradedAttempts: number;
    gradingProgress: number;
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasCoursesArray(v: unknown): v is { courses: Course[] } {
  return isRecord(v) && Array.isArray(v.courses);
}

export default function GradingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getInstructorCoursesWithGradingStats();
        if (response.success) {
          // Backend returns { data: { courses: [...], pagination: {...} } }
          const data = response.data;
          setCourses(hasCoursesArray(data) ? data.courses : []);
        } else {
          setError(
            response.error?.message || "Không thể tải danh sách khóa học"
          );
        }
      } catch (error) {
        console.error("Fetch courses error:", error);
        setError("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    // For now, we'll ignore status filtering since backend doesn't have status field
    const matchesFilter = filterStatus === "all" || true;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner h-16 w-16 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600">
            Đang tải danh sách khóa học...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8 card-glass p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                📝 Chấm điểm & Đánh giá
              </h1>
              <p className="text-lg text-gray-600">
                Quản lý bài tập và chấm điểm cho học viên của bạn
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 min-w-[200px]">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {courses.length}
                </div>
                <div className="text-sm text-gray-600">Khóa học</div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm khóa học..."
                  className="input pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  className="input min-w-[150px]"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="draft">Bản nháp</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-8">
            <AlertCircle className="h-5 w-5" />
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link
                key={course._id}
                href={`/grading/${course._id}`}
                className="group"
              >
                <div className="card hover:shadow-xl hover:scale-[1.02] transition-all duration-300 h-[340px] flex flex-col">
                  <div className="card-content flex-1 flex flex-col">
                    {/* Course Header - Fixed Height */}
                    <div className="flex items-start justify-between mb-4 h-8">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {course.tag}
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-ghost p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Course Title - Fixed Height */}
                    <div className="h-16 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-8">
                        {course.name}
                      </h3>
                    </div>

                    {/* Minimal grading focus */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-amber-800">
                            Chờ chấm
                          </div>
                          <FileText className="h-5 w-5 text-amber-700" />
                        </div>
                        <div className="mt-2 text-5xl font-bold text-amber-700">
                          {course.gradingStats?.pendingAttempts || 0}
                        </div>
                        <div className="text-xs text-amber-800/80 mt-1">
                          bài nộp
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500 text-center">
                        Cập nhật:{" "}
                        {new Date(course.updatedAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "Không tìm thấy khóa học"
                  : "Chưa có khóa học nào"}
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {searchTerm || filterStatus !== "all"
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
                  : "Bạn chưa có khóa học nào. Hãy tạo khóa học đầu tiên để bắt đầu nhận bài nộp từ học viên."}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Link href="/courses" className="btn btn-primary text-lg px-8">
                  <BookOpen className="h-5 w-5" />
                  Quản lý khóa học
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
