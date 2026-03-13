"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Star,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { CourseCreateModal } from "@/components/CourseCreateModal";
import GuideButton from "@/components/GuideButton";
import { getCourses, createCourse } from "@/lib/api";

interface Session {
  _id: string;
  name: string;
  description: string;
  orderIndex: number;
  lessons: string[];
  courseId: string;
  assignment?: string;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  originalPrice: number;
  salePrice?: number;
  level: number;
  totalStudents: number;
  rating: number;
  certificate: boolean;
  tag: string;
  sessions: Session[];
  targets: string[];
  requirements: string[];
  createdAt: string;
  updatedAt: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatUSD(value: number | undefined | null) {
  const n = Number(value ?? 0);
  return usdFormatter.format(Number.isFinite(n) ? n : 0);
}

function formatRating1dp(value: number | undefined | null) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toFixed(1) : "0.0";
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const filterCourses = useCallback(() => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel !== null) {
      filtered = filtered.filter((course) => course.level === selectedLevel);
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, selectedLevel]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [filterCourses]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await getCourses();
      console.log("🔍 Full API Response:", response);
      console.log("📊 Response.success:", response.success);
      console.log("📦 Response.data:", response.data);
      console.log("🔢 Data type:", typeof response.data);
      console.log("📋 Is Array:", Array.isArray(response.data));

      if (response.success) {
        let coursesData: Course[] = [];
        const data = response.data;

        // Handle different possible response structures
        if (Array.isArray(data)) {
          coursesData = data as Course[];
          console.log("✅ Using direct array");
        } else if (isRecord(data) && Array.isArray(data.courses)) {
          coursesData = data.courses as Course[];
          console.log("✅ Using data.courses array");
        } else if (isRecord(data) && Array.isArray(data.data)) {
          coursesData = data.data as Course[];
          console.log("✅ Using data.data array");
        } else if (isRecord(data)) {
          // If it's a single course object, wrap in array
          coursesData = [data as unknown as Course];
          console.log("✅ Using single object as array");
        } else {
          coursesData = [];
          console.log("⚠️ No valid courses data found");
        }

        console.log("📚 Final courses data:", coursesData);
        console.log("🔢 Courses count:", coursesData.length);

        // Validate course objects
        if (coursesData.length > 0) {
          console.log("📖 First course sample:", coursesData[0]);
          console.log(
            "🏷️ First course keys:",
            Object.keys(coursesData[0] || {})
          );
        }

        setCourses(coursesData);
      } else {
        console.error("❌ API Error:", response.error);
        setError(response.error?.message || "Không thể tải danh sách khóa học");
      }
    } catch (error) {
      console.error("💥 Fetch courses error:", error);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async (courseData: {
    name: string;
    description: string;
    thumbnail: string;
    originalPrice: number;
    salePrice: number;
    level: "Beginner" | "Intermediate" | "Advanced";
    tags: string[];
    targets: string[];
    requirements: string[];
    hasCertificate: boolean;
  }) => {
    try {
      // Convert level to number for backend
      const levelMap = {
        Beginner: 1,
        Intermediate: 2,
        Advanced: 3,
      };

      const response = await createCourse({
        name: courseData.name,
        description: courseData.description,
        shortDescription: courseData.description.substring(0, 100),
        thumbnail: courseData.thumbnail,
        originalPrice: courseData.originalPrice,
        salePrice: courseData.salePrice,
        level: levelMap[courseData.level],
        certificate: courseData.hasCertificate,
        tag: courseData.tags.length > 0 ? courseData.tags[0] : "General",
        targets: courseData.targets,
        requirements: courseData.requirements,
      });

      if (response.success) {
        await fetchCourses();
        setIsCreateModalOpen(false);
        setShowOnboarding(false);
      } else {
        setError(response.error?.message || "Không thể tạo khóa học");
      }
    } catch (error) {
      console.error("Create course error:", error);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
  };

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return {
          text: "Beginner",
          color: "bg-green-100 text-green-800",
          icon: "🌱",
        };
      case 2:
        return {
          text: "Intermediate",
          color: "bg-yellow-100 text-yellow-800",
          icon: "📈",
        };
      case 3:
        return {
          text: "Advanced",
          color: "bg-red-100 text-red-800",
          icon: "🚀",
        };
      default:
        return {
          text: "Beginner",
          color: "bg-green-100 text-green-800",
          icon: "🌱",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner h-16 w-16 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Đang tải khóa học...
          </h3>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Onboarding Guide */}
      {showOnboarding && courses.length === 0 && (
        <div className="card border-2 border-dashed border-blue-300 bg-blue-50/50 p-8 animate-fade-in">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Lightbulb className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Bắt đầu hành trình giảng dạy!
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Tạo khóa học đầu tiên của bạn để bắt đầu chia sẻ kiến thức với học
              viên. Chúng tôi sẽ hướng dẫn bạn từng bước để tạo ra khóa học chất
              lượng.
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
                  <span className="text-3xl">📚</span>
                </div>
                <h4 className="font-semibold text-gray-900">Tạo khóa học</h4>
                <p className="text-sm text-gray-600">
                  Thêm thông tin cơ bản về khóa học
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
                  <span className="text-3xl">🎯</span>
                </div>
                <h4 className="font-semibold text-gray-900">Thêm session</h4>
                <p className="text-sm text-gray-600">
                  Chia khóa học thành các phần học
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl shadow-sm mb-3">
                  <span className="text-3xl">🎥</span>
                </div>
                <h4 className="font-semibold text-gray-900">Upload nội dung</h4>
                <p className="text-sm text-gray-600">
                  Thêm video, tài liệu và bài tập
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary text-lg px-8 py-3"
            >
              <Plus className="h-5 w-5" />
              Tạo khóa học đầu tiên
            </button>
          </div>
        </div>
      )}

      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 card-glass p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Khóa học của bạn ({filteredCourses.length})
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý và theo dõi các khóa học bạn đang giảng dạy
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-80"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={selectedLevel || ""}
              onChange={(e) =>
                setSelectedLevel(e.target.value ? Number(e.target.value) : null)
              }
              className="input"
            >
              <option value="">Tất cả level</option>
              <option value="1">🌱 Beginner</option>
              <option value="2">📈 Intermediate</option>
              <option value="3">🚀 Advanced</option>
            </select>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5" />
              Tạo khóa học
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {courses.length}
              </div>
              <div className="text-gray-600 text-sm">Tổng khóa học</div>
            </div>
          </div>
          <div className="card p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {courses.reduce(
                  (total, course) => total + (course.totalStudents || 0),
                  0
                )}
              </div>
              <div className="text-gray-600 text-sm">Tổng học viên</div>
            </div>
          </div>
          <div className="card p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {courses.reduce(
                  (total, course) => total + (course.sessions?.length || 0),
                  0
                )}
              </div>
              <div className="text-gray-600 text-sm">Tổng session</div>
            </div>
          </div>
          <div className="card p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {courses.length > 0
                  ? (
                      courses.reduce(
                        (total, course) => total + (course.rating || 0),
                        0
                      ) / courses.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <div className="text-gray-600 text-sm">Đánh giá TB</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const levelInfo = getLevelInfo(course.level);
            return (
              <Link
                key={course._id}
                href={`/courses/${course._id}`}
                className="group"
              >
                <div
                  className="card hover:scale-[1.02] transition-all duration-300 overflow-hidden animate-scale-in h-[460px] flex flex-col"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Course Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-blue-300" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className={`badge ${levelInfo.color} font-medium`}>
                        {levelInfo.icon} {levelInfo.text}
                      </span>
                    </div>
                    {course.certificate && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-yellow-100 text-yellow-800 p-2 rounded-full">
                          🏆
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="mb-3">
                      <span className="badge badge-primary text-xs">
                        {course.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.25rem]">
                      {course.name}
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-2 min-h-[3rem]">
                      {course.shortDescription || course.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {course.sessions?.length || 0}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {course.totalStudents || 0}
                        </span>
                        <span className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          {formatRating1dp(course.rating)}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center space-x-2">
                        {course.salePrice &&
                          course.salePrice !== course.originalPrice && (
                            <span className="text-gray-500 line-through text-sm">
                              {formatUSD(course.originalPrice)}
                            </span>
                          )}
                        <span className="text-2xl font-bold text-blue-600">
                          {formatUSD(course.salePrice ?? course.originalPrice)}
                        </span>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-16">
            <div className="animate-fade-in">
              <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || selectedLevel
                  ? "Không tìm thấy khóa học"
                  : "Chưa có khóa học nào"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedLevel
                  ? "Hãy thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc"
                  : "Tạo khóa học đầu tiên để bắt đầu chia sẻ kiến thức của bạn"}
              </p>
              {!searchTerm && !selectedLevel && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-5 w-5" />
                  Tạo khóa học mới
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Create Course Modal */}
      <CourseCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCourse}
      />

      {/* Guide Button */}
      <GuideButton pageType="courses" />
    </div>
  );
}
