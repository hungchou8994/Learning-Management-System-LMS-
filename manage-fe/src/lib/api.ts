const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Programming: Problem payload (subset used for create/update)
export type ProgrammingProblemPayload = {
  title: string;
  rank: "S" | "A" | "B" | "C" | "D";
  description: string;
  testCases: Array<{
    input: string;
    output: string;
    isHidden?: boolean;
    points?: number;
    explanation?: string;
  }>;
  tags?: string[];
  languageTemplates?: {
    cpp?: string;
    python?: string;
    java?: string;
  };
  supportedLanguages?: string[];
  isInteractiveTutorial?: boolean;
  tutorialSteps?: Array<{
    stepNumber: number;
    title: string;
    description: string;
    hint?: string;
    codeTemplate?: { cpp?: string; python?: string; java?: string };
    expectedOutput?: string;
    isCompleted?: boolean;
  }>;
  hints?: Array<{ level: number; content: string; cost?: number }>;
  timeLimit?: number;
  memoryLimit?: number;
  isPublic?: boolean;
};

export const createProblem = async (
  problemData: ProgrammingProblemPayload
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/problems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(problemData),
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể tạo problem" },
    };
  } catch (error) {
    console.error("Create problem error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

// Meeting AllowList (elearn-db): upsert allowlist for a meeting room (owner only)
export const upsertMeetingAllowList = async (
  roomId: string,
  allowedUsernames: string[]
): Promise<ApiResponse<{ roomId: string; ownerId?: string; allowedUsernames?: string[] }>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/meeting/allowlist/${encodeURIComponent(roomId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ allowedUsernames }),
      }
    );

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: data.data as { roomId: string; ownerId?: string; allowedUsernames?: string[] } };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể tạo allowlist cho meeting" },
    };
  } catch (error) {
    console.error("Upsert meeting allowlist error:", error);
    return { success: false, error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
  }
};

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

// Get user info (elearn-db profile)
export const getUserInfo = async (): Promise<ApiResponse<TeacherProfile>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/elearn/user`, {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data as TeacherProfile };
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

export const deleteAiLessonPlanDraft = async (
  id: string
): Promise<ApiResponse<{ deleted?: boolean }>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/lesson-plan/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await response.json().catch(() => null);
    if (response.ok && data && data.status === "success") {
      return { success: true, data: { deleted: true } };
    }

    return {
      success: false,
      error: { message: data?.message || "Không thể xóa bản kế hoạch AI" },
    };
  } catch (error) {
    console.error("Delete AI lesson plan draft error:", error);
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

export const getCourseDetails = async <T = unknown>(
  courseId: string
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/elearn/course/${courseId}`,
      {
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data as T };
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
  feedback?: string,
  gradingMode?: "manual" | "auto" | "ai"
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
        body: JSON.stringify({ grade, feedback, gradingMode }),
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
