"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit3,
  FileText,
  Filter,
  Search,
  ChevronRight,
  BookOpen,
  Timer,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getAssignment, getCourseAttempts, gradeAttempt } from "@/lib/api";
import { MathText } from "@/components/ai/MathText";

interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Assignment {
  _id: string;
  name: string;
  description: string;
  sessionId: string;
  sessionName: string;
  sessionOrder?: number;
}

interface Attempt {
  _id: string;
  student: Student;
  assignment: Assignment;
  answers: {
    // Some older/newer payloads store either questionId OR questionIndex
    questionId?: string;
    questionIndex?: number;
    answer: string | string[];
    isCorrect?: boolean;
  }[];
  score?: number;
  maxScore: number;
  grade?: number;
  feedback?: string;
  gradingMode?: "manual" | "auto" | "ai";
  status: "submitted" | "graded" | "in_progress";
  submittedAt: string;
  gradedAt?: string;
  timeSpent: number; // in minutes
}

interface Course {
  _id: string;
  name: string;
  description: string;
  category: string;
  students_count: number;
}

interface Session {
  _id: string;
  name: string;
  orderIndex: number;
}

function getInitial(name: string, email: string) {
  const n = String(name || "").trim();
  const e = String(email || "").trim();
  const ch = (n[0] || e[0] || "?").toUpperCase();
  return ch;
}

function StudentAvatar({
  name,
  email,
  src,
  size = 48,
}: {
  name: string;
  email: string;
  src?: string;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const initial = getInitial(name, email);

  if (!src || broken) {
    return (
      <div
        className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold"
        style={{
          width: size,
          height: size,
          fontSize: Math.max(14, size / 2.6),
        }}
        aria-label={name}
        title={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className="rounded-full overflow-hidden bg-gray-100 flex-shrink-0"
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
    >
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="object-cover w-full h-full"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

export default function CourseGradingPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedSession, setSelectedSession] = useState("all");
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [assignmentDetail, setAssignmentDetail] = useState<{
    _id: string;
    name?: string;
    description?: string;
    gradingMode?: "manual" | "auto" | "ai";
    questions: Array<{
      _id: string;
      title: string;
      type: "multi_choice" | "assignment";
      orderIndex: number;
      options?: string[];
      correctAnswer?: string;
    }>;
  } | null>(null);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [answersError, setAnswersError] = useState("");

  // Grading modal state
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingMode, setGradingMode] = useState<"manual" | "auto" | "ai">(
    "manual"
  );
  const [isAiGrading, setIsAiGrading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Fetch course details
        const courseResponse = await fetch(
          `http://localhost:3000/api/elearn/course/${courseId}`,
          {
            credentials: "include",
          }
        );

        if (courseResponse.ok) {
          const courseResult = await courseResponse.json();
          if (courseResult.status === "success") {
            setCourse(courseResult.data);
          }
        }

        // Fetch attempts for this course using real API
        const attemptsResponse = await getCourseAttempts(courseId);
        if (attemptsResponse.success) {
          // Transform backend data to match frontend interface
          type BackendAttempt = {
            _id: string;
            student: Attempt["student"];
            assignment: {
              _id: string;
              name: string;
              description: string;
              sessionId: string;
              sessionName: string;
            };
            answers?: Attempt["answers"];
            grade?: number | null;
            feedback?: string;
            createdAt: string;
            gradedAt?: string;
            timeSpent?: number;
          };

          const transformedAttempts: Attempt[] = (
            attemptsResponse.data as BackendAttempt[]
          ).map((attempt) => ({
            _id: attempt._id,
            student: attempt.student,
            assignment: {
              _id: attempt.assignment._id,
              name: attempt.assignment.name,
              description: attempt.assignment.description,
              sessionId: attempt.assignment.sessionId,
              sessionName: attempt.assignment.sessionName,
            },
            answers: attempt.answers || [],
            maxScore: 100, // Default max score, should come from assignment
            grade: attempt.grade ?? undefined,
            feedback: attempt.feedback,
            gradingMode: (
              attempt as unknown as { gradingMode?: "manual" | "auto" | "ai" }
            ).gradingMode,
            status:
              attempt.grade !== undefined && attempt.grade !== null
                ? "graded"
                : "submitted",
            submittedAt: attempt.createdAt,
            gradedAt: attempt.gradedAt,
            timeSpent: attempt.timeSpent || 30, // Default if not available
          }));
          setAttempts(transformedAttempts);

          // Extract unique sessions from attempts
          const uniqueSessions = Array.from(
            new Map(
              transformedAttempts.map((attempt) => [
                attempt.assignment.sessionId,
                {
                  _id: attempt.assignment.sessionId,
                  name: attempt.assignment.sessionName,
                  orderIndex: attempt.assignment.sessionOrder || 1,
                },
              ])
            ).values()
          ).sort((a, b) => a.orderIndex - b.orderIndex);
          setSessions(uniqueSessions);
        } else {
          console.error(
            "Failed to fetch attempts:",
            attemptsResponse.error?.message
          );
          setAttempts([]); // Set empty array if failed
        }
      } catch (error) {
        console.error("Fetch data error:", error);
        setError("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const filteredAttempts = attempts.filter((attempt) => {
    const matchesSearch =
      attempt.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.assignment.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || attempt.status === filterStatus;

    const matchesSession =
      selectedSession === "all" ||
      attempt.assignment.sessionId === selectedSession;

    return matchesSearch && matchesFilter && matchesSession;
  });

  const handleGradeAttempt = (attempt: Attempt) => {
    setSelectedAttempt(attempt);
    setGrade(attempt.grade || 0);
    setFeedback(attempt.feedback || "");
    setGradingMode(attempt.gradingMode || "manual");
    setIsGradingModalOpen(true);
  };

  useEffect(() => {
    if (!isGradingModalOpen || !selectedAttempt) return;

    let cancelled = false;
    const load = async () => {
      setAnswersLoading(true);
      setAnswersError("");
      setAssignmentDetail(null);

      const res = await getAssignment(selectedAttempt.assignment._id);
      if (cancelled) return;
      if (!res.success || !res.data) {
        setAnswersError(
          res.error?.message || "Không thể tải chi tiết bài tập."
        );
        setAnswersLoading(false);
        return;
      }

      const d = res.data as unknown;
      if (typeof d !== "object" || d === null) {
        setAnswersError("Dữ liệu bài tập không hợp lệ.");
        setAnswersLoading(false);
        return;
      }

      const rec = d as Record<string, unknown>;
      const questionsRaw = Array.isArray(rec.questions) ? rec.questions : [];
      const questions = questionsRaw
        .map((q) => {
          if (typeof q !== "object" || q === null) return null;
          const qr = q as Record<string, unknown>;
          const id = String(qr._id || "");
          const title = typeof qr.title === "string" ? qr.title : "";
          const type =
            qr.type === "multi_choice" || qr.type === "assignment"
              ? (qr.type as "multi_choice" | "assignment")
              : "assignment";
          const orderIndex =
            typeof qr.orderIndex === "number" ? qr.orderIndex : 0;
          const options = Array.isArray(qr.options)
            ? qr.options.filter((x): x is string => typeof x === "string")
            : undefined;
          const correctAnswer =
            typeof qr.correctAnswer === "string" ? qr.correctAnswer : undefined;
          if (!id || !title) return null;
          return { _id: id, title, type, orderIndex, options, correctAnswer };
        })
        .filter((x): x is NonNullable<typeof x> =>
          Boolean(x && x._id && x.title)
        )
        .sort((a, b) => a.orderIndex - b.orderIndex);

      setAssignmentDetail({
        _id: String(rec._id || selectedAttempt.assignment._id),
        name: typeof rec.name === "string" ? rec.name : undefined,
        description:
          typeof rec.description === "string" ? rec.description : undefined,
        gradingMode:
          rec.gradingMode === "manual" ||
          rec.gradingMode === "auto" ||
          rec.gradingMode === "ai"
            ? (rec.gradingMode as "manual" | "auto" | "ai")
            : undefined,
        questions,
      });
      setAnswersLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isGradingModalOpen, selectedAttempt]);

  const computeAutoMcqGrade = () => {
    if (!selectedAttempt || !assignmentDetail) return null;

    const questions = assignmentDetail.questions || [];

    // Get all questions with correctAnswer (both multi_choice and assignment)
    const questionsWithAnswer = questions.filter(
      (q) => q.correctAnswer && String(q.correctAnswer).trim()
    );

    if (questionsWithAnswer.length === 0) {
      return {
        ok: false as const,
        message: "Bài này không có câu hỏi nào có đáp án đúng để chấm tự động.",
      };
    }

    // Check if any question is missing correctAnswer
    const allQuestions = questions.filter(
      (q) => q.type === "multi_choice" || q.type === "assignment"
    );
    const missing = allQuestions.some(
      (q) => !q.correctAnswer || !String(q.correctAnswer).trim()
    );
    if (missing) {
      return {
        ok: false as const,
        message:
          "Thiếu đáp án đúng (correctAnswer) cho một số câu hỏi. Vui lòng thêm đáp án đúng cho tất cả câu hỏi.",
      };
    }

    let correct = 0;
    const total = allQuestions.length;

    allQuestions.forEach((q, idx) => {
      const expected = String(q.correctAnswer || "")
        .trim()
        .toLowerCase();
      if (!expected) return;

      // Find answer by questionId OR by questionIndex
      const a =
        selectedAttempt.answers.find((x) => x.questionId === q._id) ||
        selectedAttempt.answers.find((x) => {
          const qi =
            typeof x.questionIndex === "number" ? x.questionIndex : undefined;
          if (qi === undefined) return false;
          // Prefer match by sorted position or orderIndex
          const pos = questions.findIndex((qq) => qq._id === q._id);
          return qi === pos || qi === q.orderIndex || qi === idx;
        });

      const actual = a
        ? Array.isArray(a.answer)
          ? String(a.answer[0] ?? "")
          : String(a.answer ?? "")
        : "";

      const actualNormalized = actual.trim().toLowerCase();

      // For multi_choice: exact match
      // For assignment: exact match (case-insensitive, trimmed)
      if (actualNormalized === expected) {
        correct += 1;
      }
    });

    const grade = Math.round((correct / total) * 100 * 10) / 10;
    const mcqCount = questions.filter((q) => q.type === "multi_choice").length;
    const essayCount = questions.filter((q) => q.type === "assignment").length;

    return {
      ok: true as const,
      grade,
      feedback: `Tự chấm tự động: đúng ${correct}/${total} (${mcqCount} trắc nghiệm, ${essayCount} tự luận).`,
    };
  };

  const handleAiSuggest = async () => {
    if (!selectedAttempt || !assignmentDetail) return;
    setIsAiGrading(true);
    try {
      const resp = await fetch("/api/ai/grade-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment: assignmentDetail,
          attempt: {
            studentName: selectedAttempt.student.name,
            studentEmail: selectedAttempt.student.email,
            answers: selectedAttempt.answers,
          },
        }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json || json.status !== "success") {
        setError(json?.message || "Không thể chấm bằng AI.");
        return;
      }
      setGradingMode("ai");
      setGrade(Number(json.data?.grade) || 0);
      setFeedback(String(json.data?.feedback || ""));
    } catch (e) {
      console.error("AI grading error:", e);
      setError("Lỗi kết nối khi chấm bằng AI.");
    } finally {
      setIsAiGrading(false);
    }
  };

  const submitGrade = async () => {
    if (!selectedAttempt) return;

    setIsSubmitting(true);

    try {
      // Use real API to grade attempt
      const response = await gradeAttempt(
        selectedAttempt._id,
        grade,
        feedback,
        gradingMode
      );

      if (response.success) {
        // Update attempts list
        setAttempts((prev) =>
          prev.map((attempt) =>
            attempt._id === selectedAttempt._id
              ? {
                  ...attempt,
                  grade,
                  feedback,
                  gradingMode,
                  status: "graded" as const,
                  gradedAt: new Date().toISOString(),
                }
              : attempt
          )
        );

        setIsGradingModalOpen(false);
        setSelectedAttempt(null);
      } else {
        setError(response.error?.message || "Không thể chấm điểm");
      }
    } catch (error) {
      console.error("Submit grade error:", error);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <span className="badge badge-warning">Chờ chấm</span>;
      case "graded":
        return <span className="badge badge-success">Đã chấm</span>;
      case "in_progress":
        return <span className="badge badge-info">Đang làm</span>;
      default:
        return <span className="badge badge-gray">Không xác định</span>;
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner h-16 w-16 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600">Đang tải danh sách bài nộp...</p>
        </div>
      </div>
    );
  }

  const gradedAttempts = attempts.filter((a) => a.status === "graded").length;
  const pendingAttempts = attempts.filter(
    (a) => a.status === "submitted"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link
              href="/grading"
              className="hover:text-blue-600 flex items-center transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Chấm điểm
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">
              {course?.name || "Khóa học"}
            </span>
          </div>

          {/* Course Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    {course?.category || "Programming"}
                  </div>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {course?.name || "Đang tải..."}
                </h1>
                <p className="text-gray-600">{course?.description || ""}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 lg:min-w-[280px]">
                <div className="bg-amber-50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-amber-700 mb-1">
                    {pendingAttempts}
                  </div>
                  <div className="text-sm text-amber-800">Chờ chấm</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-green-700 mb-1">
                    {gradedAttempts}
                  </div>
                  <div className="text-sm text-green-800">Đã chấm</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Search Section */}
            <div className="p-6 pb-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên học viên, email hoặc bài tập..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedSession("all");
                      setFilterStatus("all");
                      setSearchTerm("");
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Section */}
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Bộ lọc nâng cao
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Trạng thái
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="submitted">🟡 Chờ chấm</option>
                        <option value="graded">✅ Đã chấm</option>
                        <option value="in_progress">🔄 Đang làm</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ChevronRight className="h-4 w-4 text-gray-400 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Session Filter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Session
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                      >
                        <option value="all">Tất cả sessions</option>
                        {sessions.map((session) => (
                          <option key={session._id} value={session._id}>
                            📚 Session {session.orderIndex}: {session.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ChevronRight className="h-4 w-4 text-gray-400 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Results Counter */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Kết quả
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
                      <span className="text-blue-800 font-semibold">
                        {filteredAttempts.length} bài nộp
                      </span>
                      <div className="flex items-center gap-1">
                        {filteredAttempts.filter(
                          (a) => a.status === "submitted"
                        ).length > 0 && (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                            {
                              filteredAttempts.filter(
                                (a) => a.status === "submitted"
                              ).length
                            }{" "}
                            chờ chấm
                          </span>
                        )}
                        {filteredAttempts.filter((a) => a.status === "graded")
                          .length > 0 && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {
                              filteredAttempts.filter(
                                (a) => a.status === "graded"
                              ).length
                            }{" "}
                            đã chấm
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {(selectedSession !== "all" ||
                  filterStatus !== "all" ||
                  searchTerm) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-600">
                        Đang lọc:
                      </span>

                      {searchTerm && (
                        <div className="flex items-center gap-1 bg-white border border-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs">
                          <Search className="h-3 w-3" />
                          <span>&quot;{searchTerm}&quot;</span>
                          <button
                            onClick={() => setSearchTerm("")}
                            className="text-blue-600 hover:text-blue-800 ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {filterStatus !== "all" && (
                        <div className="flex items-center gap-1 bg-white border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs">
                          <Filter className="h-3 w-3" />
                          <span>
                            {filterStatus === "submitted"
                              ? "Chờ chấm"
                              : filterStatus === "graded"
                              ? "Đã chấm"
                              : filterStatus}
                          </span>
                          <button
                            onClick={() => setFilterStatus("all")}
                            className="text-amber-600 hover:text-amber-800 ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {selectedSession !== "all" && (
                        <div className="flex items-center gap-1 bg-white border border-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs">
                          <BookOpen className="h-3 w-3" />
                          <span>
                            {
                              sessions.find((s) => s._id === selectedSession)
                                ?.name
                            }
                          </span>
                          <button
                            onClick={() => setSelectedSession("all")}
                            className="text-purple-600 hover:text-purple-800 ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

        {/* Attempts List */}
        {filteredAttempts.length > 0 ? (
          <div className="space-y-4">
            {filteredAttempts.map((attempt) => (
              <div
                key={attempt._id}
                className="card hover:shadow-lg transition-all duration-300"
              >
                <div className="card-content">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Student Avatar */}
                      <StudentAvatar
                        name={attempt.student.name}
                        email={attempt.student.email}
                        src={attempt.student.avatar}
                        size={48}
                      />

                      {/* Student & Assignment Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {attempt.student.name}
                          </h3>
                          {getStatusBadge(attempt.status)}
                          {attempt.grade !== undefined && (
                            <span
                              className={`font-bold ${getScoreColor(
                                attempt.grade,
                                100
                              )}`}
                            >
                              {attempt.grade}/100
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                            {attempt.assignment.sessionName}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {attempt.assignment.name}
                          </span>
                          <span className="flex items-center">
                            <Timer className="h-4 w-4 mr-1" />
                            {attempt.timeSpent} phút
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(attempt.submittedAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>

                        {attempt.feedback && (
                          <p className="text-sm text-gray-600 italic">
                            💬 {attempt.feedback}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGradeAttempt(attempt)}
                        className={`btn ${
                          attempt.status === "graded"
                            ? "btn-ghost"
                            : "btn-primary"
                        }`}
                      >
                        {attempt.status === "graded" ? (
                          <>
                            <Eye className="h-4 w-4" />
                            Xem lại
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-4 w-4" />
                            Chấm điểm
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
                  ? "Không tìm thấy bài nộp"
                  : "Chưa có bài nộp nào"}
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {searchTerm || filterStatus !== "all"
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
                  : "Chưa có học viên nào nộp bài tập trong khóa học này."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {isGradingModalOpen && selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] mt-14 overflow-y-auto scrollbar-hide">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chấm điểm bài tập
                </h2>
                <button
                  onClick={() => setIsGradingModalOpen(false)}
                  className="btn btn-ghost p-2"
                >
                  ✕
                </button>
              </div>

              {/* Student Info */}
              <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-4 mb-3">
                  <StudentAvatar
                    name={selectedAttempt.student.name}
                    email={selectedAttempt.student.email}
                    src={selectedAttempt.student.avatar}
                    size={48}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedAttempt.student.name}
                    </h3>
                    <p className="text-gray-600">
                      {selectedAttempt.student.email}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bài tập:</span>
                    <span className="font-medium ml-2">
                      {selectedAttempt.assignment.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Thời gian làm:</span>
                    <span className="font-medium ml-2">
                      {selectedAttempt.timeSpent} phút
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Nộp lúc:</span>
                    <span className="font-medium ml-2">
                      {new Date(selectedAttempt.submittedAt).toLocaleString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className="ml-2">
                      {getStatusBadge(selectedAttempt.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Answers Preview */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Câu trả lời của học viên
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl">
                  {answersLoading ? (
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                      Đang tải câu hỏi & bài làm...
                    </div>
                  ) : answersError ? (
                    <div className="text-sm text-red-700">{answersError}</div>
                  ) : !assignmentDetail ? (
                    <div className="text-sm text-gray-700">
                      Không có dữ liệu bài tập.
                    </div>
                  ) : assignmentDetail.questions.length === 0 ? (
                    <div className="text-sm text-gray-700">
                      Bài tập chưa có câu hỏi.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignmentDetail.questions.map((q, i) => {
                        const a =
                          selectedAttempt.answers.find(
                            (x) => x.questionId === q._id
                          ) ||
                          // fallback: answer keyed by questionIndex (common in some payloads)
                          selectedAttempt.answers.find(
                            (x) =>
                              typeof x.questionIndex === "number" &&
                              (x.questionIndex === q.orderIndex ||
                                x.questionIndex === i)
                          );
                        const answerText = a
                          ? Array.isArray(a.answer)
                            ? a.answer.join(", ")
                            : String(a.answer ?? "")
                          : "";
                        const isCorrect =
                          typeof a?.isCorrect === "boolean"
                            ? a.isCorrect
                            : null;

                        const selectedIndexes = (() => {
                          const options = q.options;
                          if (!options || !a) return [];
                          const raw = a.answer;
                          const arr = Array.isArray(raw) ? raw : [raw];
                          return arr
                            .map((v) => {
                              const s = String(v ?? "").trim();
                              if (!s) return null;
                              // try numeric index
                              const n = Number(s);
                              if (
                                Number.isFinite(n) &&
                                n >= 0 &&
                                n < options.length
                              )
                                return n;
                              // try match option text
                              const idx = options.findIndex((opt) => opt === s);
                              return idx >= 0 ? idx : null;
                            })
                            .filter((x): x is number => typeof x === "number");
                        })();

                        return (
                          <div
                            key={q._id}
                            className="bg-white rounded-xl border p-4"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="font-semibold text-gray-900">
                                Câu {i + 1}: <MathText text={q.title} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="badge badge-gray">
                                  {q.type === "multi_choice"
                                    ? "Trắc nghiệm"
                                    : "Tự luận"}
                                </span>
                                {isCorrect !== null && (
                                  <span
                                    className={
                                      isCorrect
                                        ? "badge badge-success"
                                        : "badge badge-error"
                                    }
                                  >
                                    {isCorrect ? "Đúng" : "Sai"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {q.type === "multi_choice" && q.options?.length ? (
                              <div className="mt-3 space-y-2">
                                {q.options.map((opt, idxOpt) => {
                                  const chosen =
                                    selectedIndexes.includes(idxOpt);
                                  return (
                                    <div
                                      key={`${q._id}-opt-${idxOpt}`}
                                      className={
                                        "flex items-start gap-2 p-2 rounded-lg border " +
                                        (chosen
                                          ? "bg-blue-50 border-blue-200"
                                          : "bg-white border-gray-200")
                                      }
                                    >
                                      <div
                                        className={
                                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold " +
                                          (chosen
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-700")
                                        }
                                      >
                                        {String.fromCharCode(65 + idxOpt)}
                                      </div>
                                      <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                        <MathText text={opt} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}

                            <div className="mt-3">
                              <div className="text-sm font-semibold text-gray-900 mb-1">
                                Trả lời của học viên
                              </div>
                              {answerText ? (
                                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                  <MathText text={answerText} />
                                </div>
                              ) : (
                                <div className="text-sm text-gray-600 italic">
                                  (Chưa có câu trả lời)
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Show any answers that don't match a question (data drift) */}
                      {selectedAttempt.answers.some(
                        (x) =>
                          !assignmentDetail.questions.some(
                            (q) => q._id === x.questionId
                          )
                      ) && (
                        <details className="text-sm">
                          <summary className="cursor-pointer select-none text-gray-700 font-semibold">
                            Câu trả lời không khớp danh sách câu hỏi (debug)
                          </summary>
                          <pre className="mt-2 p-3 rounded bg-black/10 overflow-auto text-xs leading-relaxed">
                            {JSON.stringify(selectedAttempt.answers, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Grading Form */}
              <div className="space-y-4">
                <div>
                  <label className="label">Chế độ chấm</label>
                  <select
                    className="input"
                    value={gradingMode}
                    onChange={(e) =>
                      setGradingMode(e.target.value as "manual" | "auto" | "ai")
                    }
                  >
                    <option value="manual">1) Thủ công</option>
                    <option value="auto">2) Tự động (trắc nghiệm)</option>
                    <option value="ai">3) AI</option>
                  </select>
                  <div className="text-xs text-gray-600 mt-1">
                    {gradingMode === "manual"
                      ? "Nhập điểm và nhận xét thủ công."
                      : gradingMode === "auto"
                      ? "Dùng đáp án đúng (correctAnswer) để tính điểm trắc nghiệm."
                      : "AI gợi ý điểm + nhận xét (bạn vẫn có thể chỉnh sửa trước khi lưu)."}{" "}
                  </div>
                </div>

                {(gradingMode === "auto" || gradingMode === "ai") && (
                  <div className="flex gap-3">
                    {gradingMode === "auto" ? (
                      <button
                        type="button"
                        className="btn btn-ghost flex-1"
                        onClick={() => {
                          const auto = computeAutoMcqGrade();
                          if (!auto) return;
                          if (!auto.ok) {
                            setError(auto.message);
                            return;
                          }
                          setGrade(auto.grade);
                          setFeedback(auto.feedback);
                        }}
                        disabled={answersLoading || !assignmentDetail}
                      >
                        Tính điểm tự động
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost flex-1"
                        onClick={handleAiSuggest}
                        disabled={
                          answersLoading || !assignmentDetail || isAiGrading
                        }
                      >
                        {isAiGrading ? "Đang chấm bằng AI..." : "Chấm bằng AI"}
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label className="label">Điểm số (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="input"
                    value={grade}
                    onChange={(e) => setGrade(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="label">Nhận xét</label>
                  <textarea
                    className="input min-h-[100px]"
                    placeholder="Nhập nhận xét cho học viên..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsGradingModalOpen(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={submitGrade}
                    disabled={isSubmitting}
                    className="btn btn-primary flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Lưu điểm
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
