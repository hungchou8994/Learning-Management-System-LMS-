"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Clock,
  Video,
  FileText,
  Monitor,
  Edit,
  Trash2,
  ClipboardList,
  AlertCircle,
  ChevronRight,
  Calendar,
  Target,
  Play,
  Settings,
  MoreVertical,
  Lock,
  Unlock,
  CheckCircle2,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { LessonCreateModal } from "@/components/LessonCreateModal";
import { AssignmentCreateModal } from "@/components/AssignmentCreateModal";
import GuideButton from "@/components/GuideButton";
import {
  getSession,
  getSessionLessons,
  getSessionAssignment,
  createLesson,
  createAssignment,
  updateLesson,
  updateAssignment,
  deleteLesson,
  deleteAssignment,
} from "@/lib/api";

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

interface Lesson {
  _id: string;
  title: string;
  type: "video" | "document" | "online";
  duration: number;
  order_index: number;
  video_url?: string;
  subtitle?: string;
  description: string;
  sessionId: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  _id: string;
  name: string;
  description: string;
  ratio: number;
  duration: number;
  deadline: string;
  questions: Question[];
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

interface Question {
  _id?: string;
  id?: number;
  title: string;
  type: "multi_choice" | "assignment";
  orderIndex: number;
  order?: number;
  options?: string[];
  description?: string;
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "lessons" | "assignment" | "settings"
  >("lessons");

  // Edit session state
  const [editData, setEditData] = useState<Partial<Session>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize edit data when session loads
  useEffect(() => {
    if (session) {
      setEditData({
        name: session.name,
        description: session.description,
        orderIndex: session.orderIndex,
      });
      setIsDirty(false);
    }
  }, [session]);

  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Get session details
        const sessionResponse = await getSession(sessionId);
        if (sessionResponse.success && sessionResponse.data) {
          setSession(sessionResponse.data);
        }

        // Get lessons for this session
        const lessonsResponse = await getSessionLessons(sessionId);
        if (lessonsResponse.success) {
          setLessons(lessonsResponse.data || []);
        }

        // Get assignment for this session
        const assignmentResponse = await getSessionAssignment(sessionId);
        if (assignmentResponse.success && assignmentResponse.data) {
          setAssignment(assignmentResponse.data);
        }
      } catch (error) {
        console.error("Fetch session data error:", error);
        setError("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

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

  const handleCreateLesson = async (lessonData: unknown) => {
    try {
      console.log("🔍 Lesson data being submitted:", lessonData);

      if (editingLesson) {
        // Update existing lesson
        const response = await updateLesson(editingLesson._id, lessonData);
        if (response.success) {
          console.log("✅ Lesson updated successfully:", response.data);
          // Refresh lessons
          const refreshResponse = await getSessionLessons(sessionId);
          if (refreshResponse.success) {
            setLessons(refreshResponse.data || []);
          }
          setIsLessonModalOpen(false);
          setEditingLesson(null);
        } else {
          setError(response.error?.message || "Không thể cập nhật bài học");
        }
      } else {
        // Create new lesson
        const orderIndex = lessons.length + 1;
        const lessonPayload = {
          ...(lessonData as object),
          order_index: orderIndex,
        };
        console.log("📤 Creating lesson with payload:", lessonPayload);

        const response = await createLesson(sessionId, lessonPayload);

        if (response.success) {
          console.log("✅ Lesson created successfully:", response.data);
          // Refresh lessons
          const refreshResponse = await getSessionLessons(sessionId);
          if (refreshResponse.success) {
            setLessons(refreshResponse.data || []);
          }
          setIsLessonModalOpen(false);
        } else {
          setError(response.error?.message || "Không thể tạo bài học");
        }
      }
    } catch (error) {
      console.error("Create/Update lesson error:", error);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
  };

  const handleCreateAssignment = async (assignmentData: unknown) => {
    try {
      console.log("🔍 Assignment data being submitted:", assignmentData);

      if (editingAssignment) {
        // Update existing assignment
        const response = await updateAssignment(
          editingAssignment._id,
          assignmentData
        );
        if (response.success) {
          console.log("✅ Assignment updated successfully:", response.data);
          // Refresh assignment
          const refreshResponse = await getSessionAssignment(sessionId);
          if (refreshResponse.success && refreshResponse.data) {
            setAssignment(refreshResponse.data);
          }
          setIsAssignmentModalOpen(false);
          setEditingAssignment(null);
        } else {
          setError(response.error?.message || "Không thể cập nhật bài tập");
        }
      } else {
        // Create new assignment
        const response = await createAssignment(sessionId, assignmentData);

        if (response.success) {
          console.log("✅ Assignment created successfully:", response.data);
          // Refresh assignment
          const refreshResponse = await getSessionAssignment(sessionId);
          if (refreshResponse.success && refreshResponse.data) {
            setAssignment(refreshResponse.data);
          }
          setIsAssignmentModalOpen(false);
        } else {
          setError(response.error?.message || "Không thể tạo bài tập");
        }
      }
    } catch (error) {
      console.error("Create/Update assignment error:", error);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài học này?")) {
      try {
        const response = await deleteLesson(lessonId);
        if (response.success) {
          setLessons(lessons.filter((lesson) => lesson._id !== lessonId));
        } else {
          setError(response.error?.message || "Không thể xóa bài học");
        }
      } catch (error) {
        console.error("Delete lesson error:", error);
        setError("Lỗi kết nối. Vui lòng thử lại.");
      }
    }
  };

  const handleDeleteAssignment = async () => {
    if (confirm("Bạn có chắc chắn muốn xóa bài tập này?")) {
      try {
        if (assignment) {
          const response = await deleteAssignment(assignment._id);
          if (response.success) {
            setAssignment(null);
          } else {
            setError(response.error?.message || "Không thể xóa bài tập");
          }
        }
      } catch (error) {
        console.error("Delete assignment error:", error);
        setError("Lỗi kết nối. Vui lòng thử lại.");
      }
    }
  };

  // Handle edit field change
  const handleEditChange = (field: keyof Session, value: string | number) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  // Save session changes
  const handleSaveSession = async () => {
    if (!session?._id) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `http://localhost:3000/api/elearn/session/${session._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(editData),
        }
      );

      const result = await response.json();

      // Debug log to see what backend returns
      console.log("🔍 API Response:", result);
      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      // Check both response.ok and result.status
      if (response.ok && result.status === "success") {
        setSession((prev) => (prev ? { ...prev, ...editData } : null));
        setIsDirty(false);
        setSuccessMessage("Cập nhật session thành công!");
        // Auto hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        console.error(
          "❌ Backend returned error. HTTP Status:",
          response.status,
          "Backend Status:",
          result.status,
          "Message:",
          result.message
        );
        setErrorMessage(
          result.message ||
            `Lỗi HTTP ${response.status}: Không thể cập nhật session`
        );
      }
    } catch (error) {
      console.error("Save session error:", error);
      setErrorMessage("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    if (session) {
      setEditData({
        name: session.name,
        description: session.description,
        orderIndex: session.orderIndex,
      });
      setIsDirty(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "online":
        return <Monitor className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-800 border-red-200";
      case "document":
        return "bg-green-100 text-green-800 border-green-200";
      case "online":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "video":
        return "Video";
      case "document":
        return "Tài liệu";
      case "online":
        return "Trực tuyến";
      default:
        return "Khác";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner h-16 w-16 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600">Đang tải thông tin session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Không tìm thấy session
          </h3>
          <p className="text-gray-600 mb-8 max-w-md">
            Session không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <Link href="/courses" className="btn btn-primary">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại danh sách khóa học</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = lessons.reduce(
    (total, lesson) => total + lesson.duration,
    0
  );
  const completedLessons = lessons.filter((lesson) => !lesson.locked).length;
  const completionRate =
    lessons.length > 0
      ? Math.round((completedLessons / lessons.length) * 100)
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
            <Link
              href={`/courses/${session.courseId}`}
              className="hover:text-blue-600 transition-colors"
            >
              Quay lại khóa học
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{session.name}</span>
          </div>

          {/* Session Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm min-w-[100px] text-center">
                  Session {session.orderIndex}
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {session.name}
                </h1>
              </div>

              <p className="text-base lg:text-lg text-gray-600 mb-6 leading-relaxed max-w-3xl">
                {session.description}
              </p>

              {/* Quick Stats - Enhanced Design */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-500 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-700 mb-1">
                        {lessons.length}
                      </div>
                      <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                        Bài học
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(lessons.length * 10, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-emerald-500 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-700 mb-1">
                        {totalDuration}
                      </div>
                      <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide">
                        Phút
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-emerald-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((totalDuration / 120) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-purple-500 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-700 mb-1">
                        {completionRate}%
                      </div>
                      <div className="text-xs text-purple-600 font-medium uppercase tracking-wide">
                        Hoàn thành
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-purple-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-amber-500 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <ClipboardList className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-700 mb-1">
                        {assignment ? "1" : "0"}
                      </div>
                      <div className="text-xs text-amber-600 font-medium uppercase tracking-wide">
                        Bài tập
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: assignment ? "100%" : "0%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg p-6 border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quản lý nội dung
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={() => setIsLessonModalOpen(true)}
                    className="btn btn-primary w-full"
                  >
                    <Plus className="h-5 w-5" />
                    Thêm bài học
                  </button>

                  {!assignment ? (
                    <button
                      onClick={() => setIsAssignmentModalOpen(true)}
                      className="btn btn-success w-full"
                    >
                      <Plus className="h-5 w-5" />
                      Tạo bài tập
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingAssignment(assignment);
                        setIsAssignmentModalOpen(true);
                      }}
                      className="btn btn-ghost w-full"
                    >
                      <Edit className="h-5 w-5" />
                      Chỉnh sửa bài tập
                    </button>
                  )}

                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-3">
                      Cập nhật:{" "}
                      {new Date(session.updatedAt).toLocaleDateString("vi-VN")}
                    </p>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost flex-1 text-sm">
                        <Settings className="h-4 w-4" />
                        Cài đặt
                      </button>
                      <button className="btn btn-ghost flex-1 text-sm">
                        <MoreVertical className="h-4 w-4" />
                        Khác
                      </button>
                    </div>
                  </div>
                </div>
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
                onClick={() => setActiveTab("lessons")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "lessons"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BookOpen className="h-5 w-5 inline mr-2" />
                Bài học ({lessons.length})
              </button>
              <button
                onClick={() => setActiveTab("assignment")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "assignment"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ClipboardList className="h-5 w-5 inline mr-2" />
                Bài tập{" "}
                {assignment && (
                  <span className="badge badge-success ml-2">Có</span>
                )}
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
          {activeTab === "lessons" && (
            <div className="px-6">
              {/* Lessons Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Quản lý bài học
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Tổ chức và sắp xếp nội dung học tập
                  </p>
                </div>
                <button
                  onClick={() => setIsLessonModalOpen(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-5 w-5" />
                  Thêm bài học
                </button>
              </div>

              {/* Lessons List */}
              {lessons.length > 0 ? (
                <div className="space-y-4">
                  {lessons
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((lesson, index) => (
                      <div
                        key={lesson._id}
                        className="card hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="card-content">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              {/* Lesson Number */}
                              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold rounded-xl p-3 min-w-[60px] text-center">
                                {lesson.order_index || index + 1}
                              </div>

                              {/* Lesson Content */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span
                                    className={`badge border ${getTypeColor(lesson.type)} flex items-center gap-1`}
                                  >
                                    {getTypeIcon(lesson.type)}
                                    {getTypeText(lesson.type)}
                                  </span>
                                  <span
                                    className={`badge ${lesson.locked ? "badge-error" : "badge-success"} flex items-center gap-1`}
                                  >
                                    {lesson.locked ? (
                                      <Lock className="h-3 w-3" />
                                    ) : (
                                      <Unlock className="h-3 w-3" />
                                    )}
                                    {lesson.locked ? "Khóa" : "Mở"}
                                  </span>
                                </div>

                                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                                  {lesson.title}
                                </h3>

                                <p className="text-gray-600 mb-3">
                                  {lesson.description}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center">
                                    <Timer className="h-4 w-4 mr-1" />
                                    {lesson.duration} phút
                                  </span>
                                  <span className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(
                                      lesson.createdAt
                                    ).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              <button className="btn btn-ghost p-2 hover:bg-blue-50">
                                <Play className="h-4 w-4" />
                              </button>

                              <div className="relative group/menu">
                                <button className="btn btn-ghost p-2">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all bg-white rounded-lg shadow-lg border py-1 min-w-[140px] z-10">
                                  <button
                                    onClick={() => {
                                      setEditingLesson(lesson);
                                      setIsLessonModalOpen(true);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Chỉnh sửa
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteLesson(lesson._id)
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
                      Bắt đầu tạo bài học!
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Chưa có bài học nào trong session này. Hãy tạo bài học đầu
                      tiên để bắt đầu xây dựng nội dung.
                    </p>
                    <button
                      onClick={() => setIsLessonModalOpen(true)}
                      className="btn btn-primary text-lg px-8"
                    >
                      <Plus className="h-5 w-5" />
                      Tạo bài học đầu tiên
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "assignment" && (
            <div className="px-6">
              {/* Assignment Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Quản lý bài tập
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Tạo và quản lý bài tập đánh giá cho session
                  </p>
                </div>
                {!assignment && (
                  <button
                    onClick={() => setIsAssignmentModalOpen(true)}
                    className="btn btn-success"
                  >
                    <Plus className="h-5 w-5" />
                    Tạo bài tập
                  </button>
                )}
              </div>

              {/* Assignment Content */}
              {assignment ? (
                <div className="card">
                  <div className="card-header flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {assignment.name}
                      </h3>
                      <p className="text-gray-600">{assignment.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setIsAssignmentModalOpen(true);
                        }}
                        className="btn btn-ghost p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleDeleteAssignment}
                        className="btn btn-ghost p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="card-content">
                    {/* Assignment Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-blue-50 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {assignment.ratio}%
                        </div>
                        <div className="text-sm text-blue-800">Điểm số</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {assignment.duration}
                        </div>
                        <div className="text-sm text-green-800">Phút</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {assignment.questions.length}
                        </div>
                        <div className="text-sm text-purple-800">Câu hỏi</div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-xl text-center">
                        <div className="text-sm font-bold text-amber-600 mb-1">
                          {new Date(assignment.deadline).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                        <div className="text-sm text-amber-800">Deadline</div>
                      </div>
                    </div>

                    {/* Questions Preview */}
                    {assignment.questions.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                            <Target className="h-5 w-5 text-indigo-600" />
                          </div>
                          Xem trước câu hỏi
                        </h4>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {assignment.questions.map((question, qIndex) => (
                            <div
                              key={question._id || qIndex}
                              className="bg-gray-50 p-4 rounded-xl border"
                            >
                              <div className="flex items-start space-x-3">
                                <span className="bg-indigo-500 text-white text-sm font-bold px-3 py-1 rounded-lg min-w-[2.5rem] text-center">
                                  {qIndex + 1}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-semibold text-gray-900">
                                      {question.title}
                                    </h5>
                                    <span
                                      className={`badge ${question.type === "multi_choice" ? "badge-success" : "badge-warning"}`}
                                    >
                                      {question.type === "multi_choice"
                                        ? "Trắc nghiệm"
                                        : "Tự luận"}
                                    </span>
                                  </div>

                                  {question.type === "multi_choice" &&
                                    question.options && (
                                      <div className="space-y-2 mt-3">
                                        {question.options.map(
                                          (option, optIndex) => (
                                            <div
                                              key={optIndex}
                                              className="flex items-center space-x-2"
                                            >
                                              <span className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center text-xs font-bold bg-white">
                                                {String.fromCharCode(
                                                  65 + optIndex
                                                )}
                                              </span>
                                              <span className="text-gray-700">
                                                {option}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}

                                  {question.type === "assignment" &&
                                    question.description && (
                                      <p className="text-gray-600 italic mt-2">
                                        {question.description}
                                      </p>
                                    )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <ClipboardList className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Tạo bài tập đánh giá!
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Chưa có bài tập nào cho session này. Tạo bài tập để kiểm
                      tra kiến thức học viên.
                    </p>
                    <button
                      onClick={() => setIsAssignmentModalOpen(true)}
                      className="btn btn-success text-lg px-8"
                    >
                      <Plus className="h-5 w-5" />
                      Tạo bài tập đầu tiên
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 px-6">
              {/* Success Message */}
              {successMessage && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">
                        Thành công!
                      </h3>
                      <p className="text-green-700 text-sm">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-sm animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-500 p-2 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900">
                        Có lỗi xảy ra!
                      </h3>
                      <p className="text-red-700 text-sm">{errorMessage}</p>
                    </div>
                    <button
                      onClick={() => setErrorMessage("")}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Save/Discard Banner */}
              {isDirty && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <Edit className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          Bạn có thay đổi chưa được lưu
                        </h3>
                        <p className="text-blue-700 text-sm">
                          Nhấn &quot;Lưu thay đổi&quot; để cập nhật thông tin
                          session hoặc &quot;Hủy bỏ&quot; để quay lại.
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDiscardChanges}
                        className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={handleSaveSession}
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <span>Lưu thay đổi</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Thông tin Session
                    </h3>
                  </div>
                  <div className="card-content">
                    <div className="space-y-4">
                      <div>
                        <label className="label">Tên session</label>
                        <input
                          type="text"
                          className="input"
                          value={editData.name || ""}
                          onChange={(e) =>
                            handleEditChange("name", e.target.value)
                          }
                          placeholder="Nhập tên session"
                        />
                      </div>
                      <div>
                        <label className="label">Mô tả</label>
                        <textarea
                          className="input min-h-[100px]"
                          value={editData.description || ""}
                          onChange={(e) =>
                            handleEditChange("description", e.target.value)
                          }
                          placeholder="Nhập mô tả session"
                        />
                      </div>
                      <div>
                        <label className="label">Thứ tự</label>
                        <input
                          type="number"
                          className="input"
                          value={editData.orderIndex || 0}
                          onChange={(e) =>
                            handleEditChange(
                              "orderIndex",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Thống kê & Cài đặt
                    </h3>
                  </div>
                  <div className="card-content">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="label">Tổng bài học:</span>
                        <span className="font-medium">{lessons.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="label">Tổng thời gian:</span>
                        <span className="font-medium">
                          {totalDuration} phút
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="label">Có bài tập:</span>
                        <span
                          className={`badge ${assignment ? "badge-success" : "badge-error"}`}
                        >
                          {assignment ? "Có" : "Không"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="label">Ngày tạo:</span>
                        <span className="font-medium">
                          {new Date(session.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <LessonCreateModal
          isOpen={isLessonModalOpen}
          onClose={() => {
            setIsLessonModalOpen(false);
            setEditingLesson(null);
          }}
          onSubmit={handleCreateLesson}
          editData={editingLesson || undefined}
          isEdit={!!editingLesson}
        />

        <AssignmentCreateModal
          isOpen={isAssignmentModalOpen}
          onClose={() => {
            setIsAssignmentModalOpen(false);
            setEditingAssignment(null);
          }}
          onSubmit={handleCreateAssignment}
          editData={editingAssignment ?? undefined}
          isEdit={!!editingAssignment}
        />

        {/* Guide Button */}
        <GuideButton pageType="session-detail" />
      </div>
    </div>
  );
}
