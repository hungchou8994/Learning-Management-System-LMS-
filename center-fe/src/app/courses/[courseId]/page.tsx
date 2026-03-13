"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Clock,
  Users,
  Edit,
  Trash2,
  AlertCircle,
  ChevronRight,
  Star,
  Award,
  Calendar,
  Target,
  CheckCircle,
  PlayCircle,
  FileText,
  Settings,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { SessionCreateModal } from "@/components/SessionCreateModal";
import GuideButton from "@/components/GuideButton";
import {
  getCourseDetails,
  createSession,
  updateSession,
  deleteSession,
  updateCourse,
  deleteCourse,
} from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "sessions" | "settings"
  >("overview");

  // Edit course state
  const [editData, setEditData] = useState<Partial<Course>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize edit data when course loads
  useEffect(() => {
    if (course) {
      setEditData({
        name: course.name,
        description: course.description,
        shortDescription: course.shortDescription,
        originalPrice: course.originalPrice,
        salePrice: course.salePrice,
        level: course.level,
        certificate: course.certificate,
        tag: course.tag,
        targets: course.targets,
        requirements: course.requirements,
      });
      setIsDirty(false);
    }
  }, [course]);

  // Fetch course details and sessions
  useEffect(() => {
    const fetchCourseDetails = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getCourseDetails(courseId);
        if (response.success && response.data) {
          setCourse(response.data);
          setSessions(response.data.sessions || []);
        } else {
          setError(
            response.error?.message || "Không thể tải thông tin khóa học"
          );
        }
      } catch (error) {
        console.error("Fetch course details error:", error);
        setError("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  // Prevent navigation if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue =
          "Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleCreateSession = async (sessionData: {
    name: string;
    description: string;
  }) => {
    try {
      const response = editingSession
        ? await updateSession(editingSession._id, {
            ...sessionData,
            orderIndex: editingSession.orderIndex,
          })
        : await createSession(courseId, {
            ...sessionData,
            orderIndex: sessions.length + 1,
          });

      if (response.success) {
        // Refresh course details to get updated sessions
        const refreshResponse = await getCourseDetails(courseId);
        if (refreshResponse.success && refreshResponse.data) {
          setCourse(refreshResponse.data);
          setSessions(refreshResponse.data.sessions || []);
        }
        setIsCreateModalOpen(false);
        setEditingSession(null);
      } else {
        setError(
          response.error?.message ||
            (editingSession ? "Không thể cập nhật session" : "Không thể tạo session")
        );
      }
    } catch (error) {
      console.error("Create session error:", error);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa session này?")) {
      try {
        const response = await deleteSession(sessionId);
        if (response.success) {
          setSessions(sessions.filter((session) => session._id !== sessionId));
        } else {
          setError(response.error?.message || "Không thể xóa session");
        }
      } catch (error) {
        console.error("Delete session error:", error);
        setError("Lỗi kết nối. Vui lòng thử lại.");
      }
    }
  };

  // Handle edit course data
  const handleEditChange = (field: keyof Course, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleArrayChange = (
    field: "targets" | "requirements",
    index: number,
    value: string
  ) => {
    const currentArray = editData[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleEditChange(field, newArray);
  };

  const addArrayItem = (field: "targets" | "requirements") => {
    const currentArray = editData[field] || [];
    handleEditChange(field, [...currentArray, ""]);
  };

  const removeArrayItem = (
    field: "targets" | "requirements",
    index: number
  ) => {
    const currentArray = editData[field] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleEditChange(field, newArray);
  };

  const handleSaveCourse = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await updateCourse(courseId, editData);
      if (response.success) {
        setCourse({ ...course!, ...editData });
        setIsDirty(false);
        // Show success message
        alert("Cập nhật khóa học thành công!");
      } else {
        setError(response.error?.message || "Không thể cập nhật khóa học");
      }
    } catch (error) {
      console.error("Update course error:", error);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (confirm("Bạn có chắc chắn muốn hủy bỏ tất cả thay đổi?")) {
      if (course) {
        setEditData({
          name: course.name,
          description: course.description,
          shortDescription: course.shortDescription,
          originalPrice: course.originalPrice,
          salePrice: course.salePrice,
          level: course.level,
          certificate: course.certificate,
          tag: course.tag,
          targets: course.targets,
          requirements: course.requirements,
        });
        setIsDirty(false);
      }
    }
  };

  // Handle delete course
  const handleDeleteCourse = async () => {
    if (!course?._id) return;

    const confirmMessage = `Bạn có chắc chắn muốn xóa khóa học "${course.name}"?\n\nLưu ý: Thao tác này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu bao gồm sessions, lessons và assignments.`;

    if (confirm(confirmMessage)) {
      try {
        const response = await deleteCourse(course._id);
        if (response.success) {
          alert("Xóa khóa học thành công!");
          window.location.href = "/courses";
        } else {
          alert(response.error?.message || "Lỗi khi xóa khóa học");
        }
      } catch (error) {
        console.error("Delete course error:", error);
        alert("Lỗi kết nối. Vui lòng thử lại.");
      }
    }
  };

  const getLevelText = (level: number) => {
    switch (level) {
      case 1:
        return "🌱 Beginner";
      case 2:
        return "📈 Intermediate";
      case 3:
        return "🚀 Advanced";
      default:
        return "🌱 Beginner";
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-green-100 text-green-800 border-green-200";
      case 2:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 3:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner h-16 w-16 mx-auto"></div>
          <p className="mt-6 text-xl text-gray-600">
            Đang tải thông tin khóa học...
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-in">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Không tìm thấy khóa học
          </h3>
          <p className="text-gray-600 mb-8 max-w-md">
            Khóa học không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <Link href="/courses" className="btn btn-primary">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại danh sách khóa học</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = sessions.reduce(
    (total, session) => total + (session.lessons?.length || 0),
    0
  );
  const completionRate =
    sessions.length > 0
      ? Math.round(
          (sessions.filter((s) => s.assignment).length / sessions.length) * 100
        )
      : 0;

  return (
    <div>
      {/* // bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 */}
      <div className="bg-white shadow-lg border-b mb-6 rounded-xl">
        <div className="container mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link
              href="/courses"
              className="hover:text-blue-600 flex items-center transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Khóa học
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{course.name}</span>
          </div>

          {/* Course Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  {course.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge border ${getLevelColor(course.level)}`}
                  >
                    {getLevelText(course.level)}
                  </span>
                  {course.certificate && (
                    <span className="badge bg-amber-100 text-amber-800 border-amber-200">
                      <Award className="h-3 w-3 mr-1" />
                      Chứng chỉ
                    </span>
                  )}
                </div>
              </div>

              <p className="text-md text-gray-600 mb-6 leading-relaxed max-w-3xl">
                {course.description}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-500 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-700 mb-1">
                        {sessions.length}
                      </div>
                      <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                        Sessions
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-3/4 transition-all duration-500"></div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-emerald-500 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <PlayCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-700 mb-1">
                        {totalLessons}
                      </div>
                      <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide">
                        Bài học
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-emerald-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-4/5 transition-all duration-500"></div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-purple-500 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-700 mb-1">
                        {course.totalStudents.toLocaleString()}
                      </div>
                      <div className="text-xs text-purple-600 font-medium uppercase tracking-wide">
                        Học viên
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-purple-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full w-2/3 transition-all duration-500"></div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-amber-500 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <Star className="h-6 w-6 text-white fill-current" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-700 mb-1">
                        {Math.round(course.rating * 10) / 10}
                      </div>
                      <div className="text-xs text-amber-600 font-medium uppercase tracking-wide">
                        Đánh giá
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= Math.round(course.rating)
                            ? "text-amber-400 fill-current"
                            : "text-amber-200 fill-current"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="h-1 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${(course.rating / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Image & Price */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg p-6 border">
                {course.thumbnail && (
                  <Image
                    src={course.thumbnail}
                    alt={course.name}
                    className="w-full h-64 object-cover rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                    width={500}
                    height={400}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="shadow-lg rounded-lg">
        {/* Header Section */}

        {/* Main Content */}
        <div className="container mx-auto pb-8">
          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-8">
              {error}
              <button
                onClick={() => setError("")}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-t-xl shadow-sm border mb-8">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "overview"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Target className="h-5 w-5 inline mr-2" />
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "sessions"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BookOpen className="h-5 w-5 inline mr-2" />
                Sessions ({sessions.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "settings"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Settings className="h-5 w-5 inline mr-2" />
                Cài đặt
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-8 px-6">
              {/* Course Goals */}
              <div className="lg:col-span-2">
                <div className="card mb-8">
                  <div className="card-header">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      Mục tiêu khóa học
                    </h3>
                  </div>
                  <div className="card-content">
                    {course.targets && course.targets.length > 0 ? (
                      <ul className="space-y-3">
                        {course.targets.map((target, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{target}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">
                        Chưa có mục tiêu nào được thiết lập.
                      </p>
                    )}
                  </div>
                </div>

                {/* Requirements */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                      <div className="bg-orange-100 p-2 rounded-lg mr-3">
                        <FileText className="h-5 w-5 text-orange-600" />
                      </div>
                      Yêu cầu
                    </h3>
                  </div>
                  <div className="card-content">
                    {course.requirements && course.requirements.length > 0 ? (
                      <ul className="space-y-3">
                        {course.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">
                        Không có yêu cầu đặc biệt.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress & Stats */}
              <div className="space-y-6">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tiến độ khóa học
                    </h3>
                  </div>
                  <div className="card-content">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">
                            Hoàn thành bài tập
                          </span>
                          <span className="font-medium">{completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {sessions.length}
                          </div>
                          <div className="text-xs text-gray-600">
                            Tổng sessions
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {sessions.filter((s) => s.assignment).length}
                          </div>
                          <div className="text-xs text-gray-600">
                            Có bài tập
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Thông tin khóa học
                    </h3>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Danh mục:</span>
                        <span className="font-medium">{course.tag}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ngày tạo:</span>
                        <span className="font-medium">
                          {new Date(course.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cập nhật:</span>
                        <span className="font-medium">
                          {new Date(course.updatedAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className="badge badge-success">
                          Đang hoạt động
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="px-6">
              {/* Sessions Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Sessions
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Tổ chức nội dung khóa học thành các phần học logic
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingSession(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus className="h-5 w-5" />
                  Thêm Session
                </button>
              </div>

              {/* Sessions List */}
              {sessions.length > 0 ? (
                <div className="space-y-6">
                  {sessions.map((session, index) => (
                    <div
                      key={session._id}
                      className="card hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="card-content">
                        <div className="flex items-start justify-between">
                          <button
                            type="button"
                            onClick={() => router.push(`/sessions/${session._id}`)}
                            className="flex items-start space-x-4 flex-1 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            aria-label={`Mở session ${session.name}`}
                          >
                            {/* Session Number */}
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold rounded-xl p-3 min-w-[60px] text-center">
                              {session.orderIndex || index + 1}
                            </div>

                            {/* Session Content */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {session.name}
                                </h3>
                                {session.assignment && (
                                  <span className="badge badge-success">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Có bài tập
                                  </span>
                                )}
                              </div>

                              <p className="text-gray-600 mb-4 leading-relaxed">
                                {session.description}
                              </p>

                              {/* Session Stats */}
                              <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center text-blue-600">
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  <span className="font-medium">
                                    {session.lessons?.length || 0}
                                  </span>
                                  <span className="text-gray-500 ml-1">
                                    bài học
                                  </span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  <span>
                                    {new Date(
                                      session.createdAt
                                    ).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>
                                    ~{(session.lessons?.length || 0) * 10} phút
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <div className="relative group/menu">
                              <button className="btn btn-ghost p-2">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all bg-white rounded-lg shadow-lg border py-1 min-w-[120px] z-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSession(session);
                                    setIsCreateModalOpen(true);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Chỉnh sửa
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteSession(session._id)
                                  }
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="bg-blue-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Bắt đầu tạo Sessions!
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Sessions giúp bạn tổ chức nội dung khóa học một cách có hệ
                      thống. Mỗi session nên tập trung vào một chủ đề cụ thể.
                    </p>
                    <div className="bg-blue-50 p-6 rounded-xl mb-8 text-left">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          💡
                        </div>
                        Mẹo tạo session hiệu quả:
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-2">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          Chia nhỏ kiến thức thành các phần dễ hiểu
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          Mỗi session có 3-7 bài học là tối ưu
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          Thêm bài tập để củng cố kiến thức
                        </li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="btn btn-primary text-lg px-8"
                    >
                      <Plus className="h-5 w-5" />
                      Tạo Session Đầu Tiên
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-8 px-6">
              {/* Save/Discard Actions */}
              {isDirty && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Có thay đổi chưa được lưu
                        </h4>
                        <p className="text-sm text-gray-600">
                          Hãy lưu thay đổi trước khi rời khỏi trang.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleDiscardChanges}
                        className="btn btn-ghost"
                        disabled={isSaving}
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleSaveCourse}
                        className="btn btn-primary flex items-center space-x-2"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Lưu thay đổi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Basic Settings */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Thông tin cơ bản
                    </h3>
                  </div>
                  <div className="card-content space-y-6">
                    <div>
                      <label className="label">Tên khóa học *</label>
                      <input
                        type="text"
                        className="input"
                        value={editData.name || ""}
                        onChange={(e) =>
                          handleEditChange("name", e.target.value)
                        }
                        placeholder="Nhập tên khóa học"
                      />
                    </div>

                    <div>
                      <label className="label">Mô tả chi tiết *</label>
                      <textarea
                        className="input min-h-[120px]"
                        value={editData.description || ""}
                        onChange={(e) =>
                          handleEditChange("description", e.target.value)
                        }
                        placeholder="Mô tả chi tiết về khóa học..."
                      />
                    </div>

                    <div>
                      <label className="label">Mô tả ngắn</label>
                      <textarea
                        className="input min-h-[80px]"
                        value={editData.shortDescription || ""}
                        onChange={(e) =>
                          handleEditChange("shortDescription", e.target.value)
                        }
                        placeholder="Mô tả ngắn gọn về khóa học..."
                      />
                    </div>

                    <div>
                      <label className="label">Danh mục *</label>
                      <input
                        type="text"
                        className="input"
                        value={editData.tag || ""}
                        onChange={(e) =>
                          handleEditChange("tag", e.target.value)
                        }
                        placeholder="Ví dụ: Lập trình, Thiết kế, Marketing..."
                      />
                    </div>

                    <div>
                      <label className="label">Cấp độ *</label>
                      <select
                        className="input"
                        value={editData.level || 1}
                        onChange={(e) =>
                          handleEditChange("level", parseInt(e.target.value))
                        }
                      >
                        <option value={1}>🌱 Beginner</option>
                        <option value={2}>📈 Intermediate</option>
                        <option value={3}>🚀 Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing & Settings */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Giá & Cài đặt
                    </h3>
                  </div>
                  <div className="card-content space-y-6">
                    <div>
                      <label className="label">Giá gốc (USD) *</label>
                      <input
                        type="number"
                        className="input"
                        value={editData.originalPrice || 0}
                        onChange={(e) =>
                          handleEditChange(
                            "originalPrice",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="50"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="label">Giá khuyến mãi (USD)</label>
                      <input
                        type="number"
                        className="input"
                        value={editData.salePrice || ""}
                        onChange={(e) =>
                          handleEditChange(
                            "salePrice",
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        placeholder="40"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="label">Cấp chứng chỉ</label>
                        <p className="text-sm text-gray-500">
                          Học viên sẽ nhận chứng chỉ sau khi hoàn thành
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleEditChange("certificate", !editData.certificate)
                        }
                        className={`w-12 h-6 rounded-full transition-colors ${
                          editData.certificate ? "bg-green-500" : "bg-gray-300"
                        } relative`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            editData.certificate
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Goals & Requirements */}
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Mục tiêu khóa học
                    </h3>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {(editData.targets || []).map((target, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            className="input flex-1"
                            value={target}
                            onChange={(e) =>
                              handleArrayChange(
                                "targets",
                                index,
                                e.target.value
                              )
                            }
                            placeholder="Mục tiêu học tập..."
                          />
                          <button
                            onClick={() => removeArrayItem("targets", index)}
                            className="btn btn-ghost p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addArrayItem("targets")}
                        className="btn btn-ghost w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm mục tiêu
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Yêu cầu
                    </h3>
                  </div>
                  <div className="card-content">
                    <div className="space-y-3">
                      {(editData.requirements || []).map(
                        (requirement, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="text"
                              className="input flex-1"
                              value={requirement}
                              onChange={(e) =>
                                handleArrayChange(
                                  "requirements",
                                  index,
                                  e.target.value
                                )
                              }
                              placeholder="Yêu cầu kiến thức..."
                            />
                            <button
                              onClick={() =>
                                removeArrayItem("requirements", index)
                              }
                              className="btn btn-ghost p-2 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      )}
                      <button
                        onClick={() => addArrayItem("requirements")}
                        className="btn btn-ghost w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm yêu cầu
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card border-red-200 bg-red-50">
                <div className="card-header border-red-200">
                  <h3 className="text-xl font-semibold text-red-900 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Vùng nguy hiểm
                  </h3>
                </div>
                <div className="card-content">
                  <div className="bg-white p-6 rounded-lg border border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-red-900 mb-2">
                          Xóa khóa học
                        </h4>
                        <p className="text-red-700 text-sm mb-4">
                          Thao tác này sẽ xóa vĩnh viễn khóa học và toàn bộ dữ
                          liệu liên quan bao gồm sessions, lessons, assignments.
                          Không thể hoàn tác!
                        </p>
                        <div className="bg-red-100 p-3 rounded-lg border border-red-200 mb-4">
                          <p className="text-red-800 text-xs font-medium">
                            ⚠️ Dữ liệu sẽ bị xóa:
                          </p>
                          <ul className="text-red-700 text-xs mt-1 list-disc list-inside">
                            <li>{sessions.length} sessions</li>
                            <li>{totalLessons} bài học</li>
                            <li>Tất cả assignments và câu hỏi</li>
                            <li>
                              Lịch sử học tập của {course.totalStudents} học
                              viên
                            </li>
                          </ul>
                        </div>
                      </div>
                      <button
                        onClick={handleDeleteCourse}
                        className="btn bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 flex items-center space-x-2 ml-6"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Xóa khóa học</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Session Modal */}
        <SessionCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingSession(null);
          }}
          onSubmit={handleCreateSession}
          initialData={
            editingSession
              ? { name: editingSession.name, description: editingSession.description }
              : undefined
          }
          title={editingSession ? "Chỉnh sửa session" : "Tạo session mới"}
          submitLabel={editingSession ? "Lưu thay đổi" : "Tạo session"}
        />

        {/* Guide Button */}
        <GuideButton pageType="course-detail" />
      </div>
    </div>
  );
}
