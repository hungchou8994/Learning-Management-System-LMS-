// Always use API Gateway in center-fe (backoffice) to avoid CORS + ensure auth cookie forwarding works.
// If you point directly to individual services (auth-service/elearn-db), browser CORS and cookie scope will break.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3000";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Authentication APIs
export const login = async (
  username: string,
  password: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return {
        success: false,
        error: {
          message: data.message || "Đăng nhập thất bại",
          code: data.code,
        },
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const register = async (
  username: string,
  email: string,
  password: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        username,
        email,
        password,
        role: "teacher", // Đặt role là teacher cho SkillGro dashboard
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return {
        success: false,
        error: {
          message: data.message || "Đăng ký thất bại",
          code: data.code,
        },
      };
    }
  } catch (error) {
    console.error("Register error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Forgot password - get fake OTP
export const forgotPassword = async (username: string): Promise<ApiResponse<{ otp: string }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      return { success: true, data: data.data };
    } else {
      return {
        success: false,
        error: {
          message: data.message || "Không thể gửi OTP",
        },
      };
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Reset password with OTP
export const resetPassword = async (
  username: string,
  otp: string,
  newPassword: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, otp, newPassword }),
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      return { success: true, data };
    } else {
      return {
        success: false,
        error: {
          message: data.message || "Không thể đặt lại mật khẩu",
        },
      };
    }
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const logout = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      return { success: true };
    } else {
      return {
        success: false,
        error: {
          message: "Đăng xuất thất bại",
        },
      };
    }
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Get user info first
export const getUserInfo = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/user`, {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      return {
        success: false,
        error: {
          message: "Không thể tải thông tin người dùng",
        },
      };
    }
  } catch (error) {
    console.error("Get user info error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Auth service: get current user (role, email, etc.)
export const getAuthMe = async (): Promise<
  ApiResponse<{ role?: string; username?: string; email?: string; id?: string }>
> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });

    const data = await response.json().catch(() => null);
    if (response.ok) {
      const u =
        typeof data === "object" && data !== null && "user" in data
          ? (data as { user?: unknown }).user
          : data;
      return {
        success: true,
        data: (typeof u === "object" && u !== null ? u : {}) as {
          role?: string;
          username?: string;
          email?: string;
          id?: string;
        },
      };
    }

    return {
      success: false,
      error: {
        message: data?.message || "Không thể tải thông tin xác thực",
        code: data?.code,
      },
    };
  } catch (error) {
    console.error("Get auth me error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Auth service (manager/admin): list users by role
export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  // Profile data from elearn-db
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
};

export const listAuthUsers = async (params?: {
  role?: string;
  q?: string;
}): Promise<ApiResponse<AuthUser[]>> => {
  try {
    const qs = new URLSearchParams();
    if (params?.role) qs.set("role", params.role);
    if (params?.q) qs.set("q", params.q);

    const response = await fetch(
      `${API_BASE_URL}/api/auth/users${qs.toString() ? `?${qs.toString()}` : ""}`,
      { credentials: "include" }
    );

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: (data.data?.users || []) as AuthUser[] };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể tải danh sách tài khoản" },
    };
  } catch (error) {
    console.error("List auth users error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const deleteAuthUser = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể xóa tài khoản" },
    };
  } catch (error) {
    console.error("Delete auth user error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const updateAuthUser = async (
  id: string,
  payload: { email?: string; role?: string }
): Promise<ApiResponse<AuthUser>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      const u =
        typeof data.data === "object" &&
        data.data !== null &&
        "user" in data.data &&
        typeof (data.data as { user?: unknown }).user === "object" &&
        (data.data as { user?: unknown }).user !== null
          ? ((data.data as { user: unknown }).user as AuthUser)
          : (data.data as AuthUser);
      return { success: true, data: u };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể cập nhật tài khoản" },
    };
  } catch (error) {
    console.error("Update auth user error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

// =========================
// Center Analytics (elearn-db)
// =========================

export type RevenueSummary = {
  range: { from: string; to: string };
  kpis: {
    grossRevenue: number;
    netRevenue: number;
    ordersPaid: number;
    ordersPending: number;
    pendingAmount: number;
    uniqueBuyers: number;
    aov: number;
    refundAmount: number;
    refundRate: number;
  };
  assumptions?: Record<string, unknown>;
};

export type RevenueTrendPoint = {
  bucket: string; // YYYY-MM-DD or YYYY-MM
  paidRevenue: number;
  paidEnrollments: number;
  pendingEnrollments: number;
  pendingAmount: number;
  uniqueBuyers: number;
  newRevenue?: number;
  returningRevenue?: number;
};

export type RevenueTrend = {
  range: { from: string; to: string };
  granularity: "day" | "month";
  points: RevenueTrendPoint[];
};

export type RevenueByCourseRow = {
  courseId: string;
  courseName: string;
  instructorId?: string;
  category: string;
  paidRevenue: number;
  paidEnrollments: number;
  pendingEnrollments: number;
};

export type RevenueByTeacherRow = {
  teacherId?: string;
  username?: string;
  name?: string;
  paidRevenue: number;
  paidEnrollments: number;
  pendingEnrollments: number;
  coursesCount: number;
};

export type RevenueByCategoryRow = {
  category: string;
  paidRevenue: number;
  paidEnrollments: number;
  pendingEnrollments: number;
};

export type StudentAnalyticsRow = {
  username: string;
  paidRevenue: number;
  paidEnrollments: number;
  pendingEnrollments: number;
  firstPaidAt: string | null;
  lastPaidAt: string | null;
  aov: number;
  segment: "unknown" | "new_or_recent" | "active" | "at_risk" | "churned";
};

export type StudentAnalyticsDetail = {
  range: { from: string; to: string };
  student: {
    username: string;
    segment: string;
    paidRevenue: number;
    paidEnrollments: number;
    pendingEnrollments: number;
    aov: number;
    firstPaidAt: string | null;
    lastPaidAt: string | null;
  };
  enrollments: Array<{
    enrollmentId: string;
    createdAt: string;
    status: "paid" | "not_paid";
    paymentMethod?: "cash" | "bank";
    progress?: number;
    courseId: string;
    courseName: string;
    category: string;
    price: number;
    instructorId?: string;
  }>;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    qs.set(k, String(v));
  }
  return qs.toString();
}

export const getRevenueSummary = async (params?: {
  from?: string;
  to?: string;
  courseId?: string;
  teacherId?: string;
  category?: string;
}): Promise<ApiResponse<RevenueSummary>> => {
  try {
    const qs = toQuery({
      from: params?.from,
      to: params?.to,
      courseId: params?.courseId,
      teacherId: params?.teacherId,
      category: params?.category,
    });
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/analytics/revenue/summary${qs ? `?${qs}` : ""}`,
      { credentials: "include" }
    );

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as RevenueSummary };
    }
    return { success: false, error: { message: data?.message || "Không thể tải revenue summary" } };
  } catch (error) {
    console.error("getRevenueSummary error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const getRevenueTrend = async (params?: {
  from?: string;
  to?: string;
  granularity?: "day" | "month";
  courseId?: string;
  teacherId?: string;
  category?: string;
  includeNewReturning?: boolean;
}): Promise<ApiResponse<RevenueTrend>> => {
  try {
    const qs = toQuery({
      from: params?.from,
      to: params?.to,
      granularity: params?.granularity || "day",
      courseId: params?.courseId,
      teacherId: params?.teacherId,
      category: params?.category,
      includeNewReturning: params?.includeNewReturning ? "1" : undefined,
    });
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/analytics/revenue/trend?${qs}`,
      { credentials: "include" }
    );

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as RevenueTrend };
    }
    return { success: false, error: { message: data?.message || "Không thể tải revenue trend" } };
  } catch (error) {
    console.error("getRevenueTrend error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const getRevenueByCourse = async (params?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<ApiResponse<RevenueByCourseRow[]>> => {
  try {
    const qs = toQuery({ from: params?.from, to: params?.to, limit: params?.limit ?? 20 });
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/analytics/revenue/by-course?${qs}`,
      { credentials: "include" }
    );
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: (data.data?.rows || []) as RevenueByCourseRow[] };
    }
    return { success: false, error: { message: data?.message || "Không thể tải revenue by course" } };
  } catch (error) {
    console.error("getRevenueByCourse error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const getRevenueByTeacher = async (params?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<ApiResponse<RevenueByTeacherRow[]>> => {
  try {
    const qs = toQuery({ from: params?.from, to: params?.to, limit: params?.limit ?? 20 });
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/analytics/revenue/by-teacher?${qs}`,
      { credentials: "include" }
    );
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: (data.data?.rows || []) as RevenueByTeacherRow[] };
    }
    return { success: false, error: { message: data?.message || "Không thể tải revenue by teacher" } };
  } catch (error) {
    console.error("getRevenueByTeacher error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const getRevenueByCategory = async (params?: {
  from?: string;
  to?: string;
}): Promise<ApiResponse<RevenueByCategoryRow[]>> => {
  try {
    const qs = toQuery({ from: params?.from, to: params?.to });
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/analytics/revenue/by-category?${qs}`,
      { credentials: "include" }
    );
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: (data.data?.rows || []) as RevenueByCategoryRow[] };
    }
    return { success: false, error: { message: data?.message || "Không thể tải revenue by category" } };
  } catch (error) {
    console.error("getRevenueByCategory error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const listStudentAnalytics = async (params?: {
  from?: string;
  to?: string;
  q?: string;
  segment?: string;
  limit?: number;
}): Promise<ApiResponse<StudentAnalyticsRow[]>> => {
  try {
    const qs = toQuery({
      from: params?.from,
      to: params?.to,
      q: params?.q,
      segment: params?.segment,
      limit: params?.limit ?? 200,
    });
    const response = await fetch(`${API_BASE_URL}/api/elearn/analytics/students?${qs}`, {
      credentials: "include",
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: (data.data?.rows || []) as StudentAnalyticsRow[] };
    }
    return { success: false, error: { message: data?.message || "Không thể tải danh sách học sinh" } };
  } catch (error) {
    console.error("listStudentAnalytics error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const getStudentAnalyticsDetail = async (
  username: string,
  params?: { from?: string; to?: string; limit?: number }
): Promise<ApiResponse<StudentAnalyticsDetail>> => {
  try {
    const qs = toQuery({ from: params?.from, to: params?.to, limit: params?.limit ?? 50 });
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/analytics/students/${encodeURIComponent(username)}?${qs}`,
      { credentials: "include" }
    );
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as StudentAnalyticsDetail };
    }
    return { success: false, error: { message: data?.message || "Không thể tải chi tiết học sinh" } };
  } catch (error) {
    console.error("getStudentAnalyticsDetail error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

// User profile (elearn-db): update user information
export type TeacherProfile = {
  username?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  dob?: string;
  bio?: string;
  phoneNumber?: string;
  skill?: string;
  avatarUrl?: string;
  coverUrl?: string;
};

export const updateUserInformation = async (
  payload: Partial<TeacherProfile>
): Promise<ApiResponse<TeacherProfile>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/user/information`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as TeacherProfile };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể cập nhật thông tin" },
    };
  } catch (error) {
    console.error("Update user information error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

// Get user profiles by usernames (batch) - for admin/manager
export type UserProfile = {
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  address?: string;
  dob?: string;
  skill?: string;
};

export const getUserProfilesByUsernames = async (
  usernames: string[]
): Promise<ApiResponse<UserProfile[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/user/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ usernames }),
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: (data.data || []) as UserProfile[] };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể tải thông tin người dùng" },
    };
  } catch (error) {
    console.error("Get user profiles by usernames error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

// Update user information by username (for admin/manager)
export const updateUserInformationByUsername = async (
  username: string,
  payload: Partial<TeacherProfile>
): Promise<ApiResponse<TeacherProfile>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/user/information/${encodeURIComponent(username)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as TeacherProfile };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể cập nhật thông tin" },
    };
  } catch (error) {
    console.error("Update user information by username error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

// Auth service: update profile (currently: email)
export const updateAuthProfile = async (payload: {
  email: string;
}): Promise<ApiResponse<{ user?: { email?: string; username?: string; role?: string } }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as { user?: { email?: string; username?: string; role?: string } } };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể cập nhật email" },
    };
  } catch (error) {
    console.error("Update auth profile error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

// Auth service: change password
export const changeAuthPassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể đổi mật khẩu" },
    };
  } catch (error) {
    console.error("Change auth password error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

// AI Lesson Plan Draft APIs (stored in elearn-db)
export type AiLessonPlanDraftDoc = {
  _id: string;
  lessonTopic: string;
  subject: string;
  grade: number;
  textbook: string;
  createdAt: string;
  prompt?: string;
  structure: unknown;
};

export const createAiLessonPlanDraft = async (payload: {
  structure: unknown;
  input?: unknown;
  prompt?: string;
  model?: string;
}): Promise<ApiResponse<AiLessonPlanDraftDoc>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/lesson-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok && data.status === "success") {
      return { success: true, data: data.data as AiLessonPlanDraftDoc };
    }

    return {
      success: false,
      error: { message: data.message || "Không thể lưu bản kế hoạch AI" },
    };
  } catch (error) {
    console.error("Create AI lesson plan draft error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

export const listAiLessonPlanDrafts = async (): Promise<
  ApiResponse<AiLessonPlanDraftDoc[]>
> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/lesson-plan`, {
      credentials: "include",
    });

    const data = await response.json();
    if (response.ok && data.status === "success") {
      return { success: true, data: data.data as AiLessonPlanDraftDoc[] };
    }

    return {
      success: false,
      error: { message: data.message || "Không thể tải danh sách bản kế hoạch AI" },
    };
  } catch (error) {
    console.error("List AI lesson plan drafts error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

export const updateAiLessonPlanDraft = async (
  id: string,
  payload: { status?: "draft" | "archived"; structure?: unknown }
): Promise<ApiResponse<AiLessonPlanDraftDoc>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/lesson-plan/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok && data.status === "success") {
      return { success: true, data: data.data as AiLessonPlanDraftDoc };
    }

    return {
      success: false,
      error: { message: data.message || "Không thể cập nhật bản kế hoạch AI" },
    };
  } catch (error) {
    console.error("Update AI lesson plan draft error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

export const getAiLessonPlanDraftById = async (
  id: string
): Promise<ApiResponse<AiLessonPlanDraftDoc>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/lesson-plan/${id}`, {
      credentials: "include",
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as AiLessonPlanDraftDoc };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể tải bản kế hoạch AI" },
    };
  } catch (error) {
    console.error("Get AI lesson plan draft by id error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

// Course Management APIs - lấy courses của instructor hiện tại
export const getCourses = async (): Promise<ApiResponse> => {
  try {
    // Sử dụng endpoint mới cho instructor courses
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/instructor-courses`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      return {
        success: false,
        error: {
          message: "Không thể tải danh sách khóa học",
        },
      };
    }
  } catch (error) {
    console.error("Get courses error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Center dashboard: list all courses for revenue analytics
export type CenterCourse = {
  _id: string;
  name: string;
  description: string;
  originalPrice: number;
  salePrice?: number;
  totalStudents?: number;
  rating?: number;
  createdAt?: string;
};

export const getAllCoursesForCenter = async (): Promise<
  ApiResponse<CenterCourse[]>
> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/course`, {
      credentials: "include",
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      // elearn-db returns: { status:"success", data: { courses: [...], pagination: {...} } }
      const courses =
        typeof data.data === "object" &&
        data.data !== null &&
        "courses" in data.data &&
        Array.isArray((data.data as { courses?: unknown }).courses)
          ? ((data.data as { courses: unknown[] }).courses as CenterCourse[])
          : [];
      return { success: true, data: courses };
    }
    return {
      success: false,
      error: { message: data?.message || "Không thể tải danh sách khóa học" },
    };
  } catch (error) {
    console.error("Get all courses (center) error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

// Teacher applications (center)
export type TeacherApplicationStatus = "draft" | "pending" | "approved" | "rejected";
export type TeacherApplication = {
  _id: string;
  fullName: string;
  dob?: string;
  address?: string;
  email: string;
  phoneNumber?: string;
  idCardFrontFile?: string;
  idCardBackFile?: string;
  cvFile?: string;
  subjects?: string[];
  experienceYears?: number;
  message?: string;
  status: TeacherApplicationStatus;
  source?: "teacher" | "center";
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export const createTeacherApplication = async (payload: {
  fullName: string;
  email: string;
  phoneNumber?: string;
  subjects?: string[];
  experienceYears?: number;
  message?: string;
}): Promise<ApiResponse<TeacherApplication>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/teacher-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as TeacherApplication };
    }
    return {
      success: false,
      error: { message: data?.message || "Không thể gửi đơn ứng tuyển" },
    };
  } catch (error) {
    console.error("Create teacher application error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const listTeacherApplications = async (): Promise<
  ApiResponse<TeacherApplication[]>
> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/teacher-applications`, {
      credentials: "include",
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: (data.data || []) as TeacherApplication[] };
    }
    return {
      success: false,
      error: { message: data?.message || "Không thể tải danh sách đơn ứng tuyển" },
    };
  } catch (error) {
    console.error("List teacher applications error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const createTeacherApplicationDraft = async (payload: {
  email: string;
  fullName?: string;
}): Promise<ApiResponse<TeacherApplication>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/teacher-applications/draft`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as TeacherApplication };
    }
    return {
      success: false,
      error: { message: data?.message || "Không thể tạo hồ sơ trống" },
    };
  } catch (error) {
    console.error("Create teacher application draft error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const updateTeacherApplicationDetails = async (
  id: string,
  payload: {
    fullName?: string;
    dob?: string; // yyyy-mm-dd
    address?: string;
    email?: string;
    phoneNumber?: string;
    subjects?: string[];
    experienceYears?: number;
    message?: string;
    idCardFront?: File | null;
    idCardBack?: File | null;
    cv?: File | null;
  }
): Promise<ApiResponse<TeacherApplication>> => {
  try {
    const fd = new FormData();
    if (typeof payload.fullName === "string") fd.append("fullName", payload.fullName);
    if (typeof payload.dob === "string") fd.append("dob", payload.dob);
    if (typeof payload.address === "string") fd.append("address", payload.address);
    if (typeof payload.email === "string") fd.append("email", payload.email);
    if (typeof payload.phoneNumber === "string") fd.append("phoneNumber", payload.phoneNumber);
    if (typeof payload.message === "string") fd.append("message", payload.message);
    if (Array.isArray(payload.subjects)) {
      for (const s of payload.subjects) fd.append("subjects[]", s);
    }
    if (typeof payload.experienceYears === "number")
      fd.append("experienceYears", String(payload.experienceYears));

    if (payload.idCardFront) fd.append("idCardFront", payload.idCardFront);
    if (payload.idCardBack) fd.append("idCardBack", payload.idCardBack);
    if (payload.cv) fd.append("cv", payload.cv);

    const response = await fetch(
      `${API_BASE_URL}/api/elearn/teacher-applications/${id}/details`,
      {
        method: "PATCH",
        credentials: "include",
        body: fd,
      }
    );
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as TeacherApplication };
    }
    return {
      success: false,
      error: { message: data?.message || "Không thể cập nhật hồ sơ" },
    };
  } catch (error) {
    console.error("Update teacher application details error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const updateTeacherApplicationStatus = async (
  id: string,
  status: TeacherApplicationStatus
): Promise<ApiResponse<TeacherApplication>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/teacher-applications/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      }
    );
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as TeacherApplication };
    }
    return {
      success: false,
      error: { message: data?.message || "Không thể cập nhật đơn ứng tuyển" },
    };
  } catch (error) {
    console.error("Update teacher application status error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const syncCoursesAggregates = async (): Promise<
  ApiResponse<{ courses: number; updatedAt: string }>
> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/admin/sync-courses`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as { courses: number; updatedAt: string } };
    }
    return {
      success: false,
      error: { message: data?.message || "Không thể đồng bộ khóa học" },
    };
  } catch (error) {
    console.error("Sync courses aggregates error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

export const createCourse = async (courseData: unknown): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/course`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(courseData),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể tạo khóa học",
        },
      };
    }
  } catch (error) {
    console.error("Create course error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const updateCourse = async (
  courseId: string,
  courseData: unknown
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/${courseId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(courseData),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể cập nhật khóa học",
        },
      };
    }
  } catch (error) {
    console.error("Update course error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const deleteCourse = async (courseId: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/${courseId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể xóa khóa học",
        },
      };
    }
  } catch (error) {
    console.error("Delete course error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const getCourseDetails = async (
  courseId: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/${courseId}`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      return {
        success: false,
        error: {
          message: "Không thể tải thông tin khóa học",
        },
      };
    }
  } catch (error) {
    console.error("Get course details error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Session Management APIs
export const createSession = async (
  courseId: string,
  sessionData: unknown
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/${courseId}/session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(sessionData),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể tạo session",
        },
      };
    }
  } catch (error) {
    console.error("Create session error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const updateSession = async (
  sessionId: string,
  sessionData: unknown
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/session/${sessionId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(sessionData),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể cập nhật session",
        },
      };
    }
  } catch (error) {
    console.error("Update session error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const deleteSession = async (
  sessionId: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/session/${sessionId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể xóa session",
        },
      };
    }
  } catch (error) {
    console.error("Delete session error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Lesson Management APIs
export const createLesson = async (
  sessionId: string,
  lessonData: unknown
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/lesson/session/${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(lessonData),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể tạo bài học",
        },
      };
    }
  } catch (error) {
    console.error("Create lesson error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const updateLesson = async (
  lessonId: string,
  lessonData: unknown
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/lesson/${lessonId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(lessonData),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể cập nhật bài học",
        },
      };
    }
  } catch (error) {
    console.error("Update lesson error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const deleteLesson = async (lessonId: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/lesson/${lessonId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể xóa bài học",
        },
      };
    }
  } catch (error) {
    console.error("Delete lesson error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const getSession = async (sessionId: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/session/${sessionId}`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      return {
        success: false,
        error: {
          message: "Không thể tải thông tin session",
        },
      };
    }
  } catch (error) {
    console.error("Get session error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const getSessionLessons = async (
  sessionId: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/lesson/session/${sessionId}`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      return {
        success: false,
        error: {
          message: "Không thể tải danh sách bài học",
        },
      };
    }
  } catch (error) {
    console.error("Get session lessons error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Assignment Management APIs
export const createAssignment = async (
  sessionId: string,
  assignmentData: unknown
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/assignment/session/${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(assignmentData),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể tạo bài tập",
        },
      };
    }
  } catch (error) {
    console.error("Create assignment error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const updateAssignment = async (
  assignmentId: string,
  assignmentData: unknown
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/assignment/${assignmentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(assignmentData),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể cập nhật bài tập",
        },
      };
    }
  } catch (error) {
    console.error("Update assignment error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const deleteAssignment = async (
  assignmentId: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/assignment/${assignmentId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể xóa bài tập",
        },
      };
    }
  } catch (error) {
    console.error("Delete assignment error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const getSessionAssignment = async (
  sessionId: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/assignment/session/${sessionId}`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể tải bài tập",
        },
      };
    }
  } catch (error) {
    console.error("Get session assignment error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

export const getAssignment = async (
  assignmentId: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/assignment/${assignmentId}`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể tải chi tiết bài tập",
        },
      };
    }
  } catch (error) {
    console.error("Get assignment error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Get instructor courses for grading
export const getInstructorCourses = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/instructor-courses`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      return {
        success: false,
        error: {
          message: "Không thể tải danh sách khóa học",
        },
      };
    }
  } catch (error) {
    console.error("Get instructor courses error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Get instructor courses with grading statistics
export const getInstructorCoursesWithGradingStats =
  async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/elearn/course/instructor-courses-grading`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data };
      } else {
        return {
          success: false,
          error: {
            message: "Không thể tải danh sách khóa học với thống kê chấm điểm",
          },
        };
      }
    } catch (error) {
      console.error("Get instructor courses with grading stats error:", error);
      return {
        success: false,
        error: {
          message: "Lỗi kết nối. Vui lòng thử lại.",
        },
      };
    }
  };

// Students (instructor view): list students enrolled in instructor courses
export type InstructorEnrolledStudent = {
  enrollmentId: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  status: "paid" | "not_paid";
  progress: number;
  enrolledAt: string;
};

export type InstructorCourseStudentsGroup = {
  course: { _id: string; name: string; tag?: string; thumbnail?: string };
  students: InstructorEnrolledStudent[];
  stats: { total: number; paid: number; not_paid: number };
};

export const getInstructorEnrolledStudents = async (params?: {
  status?: "paid" | "not_paid" | "all";
}): Promise<
  ApiResponse<{
    courses: InstructorCourseStudentsGroup[];
    totals: { courses: number; students: number };
  }>
> => {
  try {
    const qs =
      params?.status && params.status !== "all"
        ? `?status=${encodeURIComponent(params.status)}`
        : "";

    const response = await fetch(
      `${API_BASE_URL}/api/elearn/enroll/instructor/students${qs}`,
      { credentials: "include" }
    );

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return {
        success: true,
        data: data.data as {
          courses: InstructorCourseStudentsGroup[];
          totals: { courses: number; students: number };
        },
      };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể tải danh sách học sinh" },
    };
  } catch (error) {
    console.error("Get instructor enrolled students error:", error);
    return {
      success: false,
      error: { message: "Lỗi kết nối. Vui lòng thử lại." },
    };
  }
};

// Get course attempts for grading
export const getCourseAttempts = async (
  courseId: string,
  status?: string,
  sessionId?: string
): Promise<ApiResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);
    if (sessionId) queryParams.append("sessionId", sessionId);

    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/${courseId}/attempts${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      return {
        success: false,
        error: {
          message: "Không thể tải danh sách bài làm của học viên",
        },
      };
    }
  } catch (error) {
    console.error("Get course attempts error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};

// Grade an attempt
export const gradeAttempt = async (
  attemptId: string,
  grade: number,
  feedback?: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/attempt/${attemptId}/grade`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ grade, feedback }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          message: errorData.message || "Không thể chấm điểm bài làm",
        },
      };
    }
  } catch (error) {
    console.error("Grade attempt error:", error);
    return {
      success: false,
      error: {
        message: "Lỗi kết nối. Vui lòng thử lại.",
      },
    };
  }
};
