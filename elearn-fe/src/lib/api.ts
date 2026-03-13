import { API_CONFIG, API_ENDPOINTS } from "./config";

// Define response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

// Define auth types
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

// Define course types
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  price: number;
  duration: number;
  level: string;
  category: string;
}

// Helper function to make API requests
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Always include credentials
    options.credentials = "include";

    // Add content type for POST/PUT requests
    if (options.method && ["POST", "PUT"].includes(options.method)) {
      options.headers = {
        ...options.headers,
        "Content-Type": "application/json",
      };
    }

    const response = await fetch(url, options);
    const data = await response.json();

    console.log("API Response:", data);

    // If token is expired, try to refresh it
    if (response.status === 401 && data.error?.code === "TOKEN_EXPIRED") {
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        // Retry the original request
        return apiRequest<T>(url, options);
      }
    }

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: {
          code: response.status.toString(),
          message: data.error?.message || "An error occurred",
        },
      };
    }

    return {
      success: true,
      data: data.data || data,
      error: null,
    };
  } catch (error) {
    console.error("API Request Error:", error);
    return {
      success: false,
      data: null,
      error: {
        code: "UNKNOWN",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
    };
  }
}

// Helper function to handle token refresh
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_CONFIG.AUTH_API_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!response.ok) return false;

    const data = await response.json();
    console.log("Refresh Token Response:", data);

    return data.status === "success";
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return false;
  }
}

// Auth functions
export async function login(
  username: string,
  password: string
): Promise<ApiResponse<AuthResponse>> {
  const response = await apiRequest<AuthResponse>(
    `${API_CONFIG.AUTH_API_URL}${API_ENDPOINTS.AUTH.LOGIN}`,
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }
  );

  if (response.success) {
    console.log("Login Response:", response);
  }

  return response;
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<ApiResponse<AuthResponse>> {
  const response = await apiRequest<AuthResponse>(
    `${API_CONFIG.AUTH_API_URL}${API_ENDPOINTS.AUTH.REGISTER}`,
    {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }
  );

  if (response.success) {
    console.log("Register Response:", response);
  }

  return response;
}

export async function logout(): Promise<ApiResponse> {
  const response = await apiRequest(
    `${API_CONFIG.AUTH_API_URL}${API_ENDPOINTS.AUTH.LOGOUT}`,
    {
      method: "POST",
    }
  );

  return response;
}

export async function forgotPassword(
  username: string
): Promise<ApiResponse<{ otp: string; emailMasked?: string }>> {
  const response = await apiRequest<{ otp: string; emailMasked?: string }>(
    `${API_CONFIG.AUTH_API_URL}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`,
    {
      method: "POST",
      body: JSON.stringify({ username }),
    }
  );

  return response;
}

export async function resetPassword(
  username: string,
  otp: string,
  newPassword: string
): Promise<ApiResponse> {
  const response = await apiRequest(
    `${API_CONFIG.AUTH_API_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`,
    {
      method: "POST",
      body: JSON.stringify({ username, otp, newPassword }),
    }
  );

  return response;
}

// Problem types
export interface Problem {
  _id: string;
  title: string;
  rank: "S" | "A" | "B" | "C" | "D";
  description: string;
  testCases: Array<{
    input: string;
    output: string;
    isHidden: boolean;
    points: number;
    explanation?: string;
  }>;
  tags: string[];
  languageTemplates: {
    cpp?: string;
    python?: string;
    java?: string;
  };
  supportedLanguages: string[];
  isInteractiveTutorial: boolean;
  tutorialSteps?: Array<{
    stepNumber: number;
    title: string;
    description: string;
    hint?: string;
    codeTemplate: {
      cpp?: string;
      python?: string;
      java?: string;
    };
    expectedOutput?: string;
    isCompleted: boolean;
  }>;
  hints: Array<{
    level: number;
    content: string;
    cost: number;
  }>;
  timeLimit: number;
  memoryLimit: number;
  author: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProblemListResponse {
  problems: Problem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProblems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    rank?: string;
    language?: string;
    tutorial?: string;
    search?: string;
    sort?: string;
  };
}

export interface ProblemStats {
  totalProblems: number;
  tutorialProblems: number;
  regularProblems: number;
  byRank: Array<{
    _id: string;
    count: number;
  }>;
  byLanguage: Array<{
    _id: string;
    count: number;
  }>;
  recentProblems: Array<{
    _id: string;
    title: string;
    rank: string;
    createdAt: string;
    author: {
      username: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
}

// Problem API functions
export async function getAllProblems(
  page = 1,
  limit = 10,
  filters: {
    rank?: string;
    language?: string;
    tutorial?: boolean;
    search?: string;
    sort?: string;
  } = {}
): Promise<ApiResponse<ProblemListResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== "")
    ),
  });

  return apiRequest<ProblemListResponse>(
    `${API_CONFIG.ELEARN_API_URL}${API_ENDPOINTS.ELEARN.PROBLEMS.BASE}?${params}`
  );
}

export async function getProblemById(
  problemId: string
): Promise<ApiResponse<Problem>> {
  return apiRequest<Problem>(
    `${API_CONFIG.ELEARN_API_URL}${API_ENDPOINTS.ELEARN.PROBLEMS.BY_ID(problemId)}`
  );
}

// Get problem with all test cases for submission (authenticated users only)
export async function getProblemForSubmission(
  problemId: string
): Promise<ApiResponse<Problem>> {
  return apiRequest<Problem>(
    `${API_CONFIG.ELEARN_API_URL}${API_ENDPOINTS.ELEARN.PROBLEMS.BY_ID(problemId)}/submission`
  );
}

// Submit code directly to processing service
export async function submitToProcessingService(
  code: string,
  language: string,
  inputData: string,
  expectedOutput: string,
  problemId?: string
): Promise<ApiResponse<any>> {
  const processingUrl = `${process.env.NEXT_PUBLIC_PROCESSING_SERVICE_URL || 'http://localhost:3003'}/api/process/submit`;
  
  const response = await fetch(processingUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mainCode: code,
      language: language,
      inputData: inputData,
      expectedOutput: expectedOutput,
      problemId: problemId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      data: null,
      error: {
        code: response.status.toString(),
        message: `Processing service error: ${errorText}`,
      },
    };
  }

  const data = await response.json();
  return {
    success: true,
    data: data,
    error: null,
  };
}

export async function createProblem(
  problemData: Omit<Problem, "_id" | "author" | "createdAt" | "updatedAt">
): Promise<ApiResponse<Problem>> {
  return apiRequest<Problem>(
    `${API_CONFIG.ELEARN_API_URL}${API_ENDPOINTS.ELEARN.PROBLEMS.BASE}`,
    {
      method: "POST",
      body: JSON.stringify(problemData),
    }
  );
}

export async function updateProblem(
  problemId: string,
  problemData: Partial<Omit<Problem, "_id" | "author" | "createdAt" | "updatedAt">>
): Promise<ApiResponse<Problem>> {
  return apiRequest<Problem>(
    `${API_CONFIG.ELEARN_API_URL}${API_ENDPOINTS.ELEARN.PROBLEMS.BY_ID(problemId)}`,
    {
      method: "PUT",
      body: JSON.stringify(problemData),
    }
  );
}

export async function deleteProblem(
  problemId: string
): Promise<ApiResponse<void>> {
  return apiRequest<void>(
    `${API_CONFIG.ELEARN_API_URL}${API_ENDPOINTS.ELEARN.PROBLEMS.BY_ID(problemId)}`,
    {
      method: "DELETE",
    }
  );
}

export async function getProblemStats(): Promise<ApiResponse<ProblemStats>> {
  return apiRequest<ProblemStats>(
    `${API_CONFIG.ELEARN_API_URL}${API_ENDPOINTS.ELEARN.PROBLEMS.STATS}`
  );
}

// Submission types
export interface SubmissionResult {
  problemId: string;
  userId: string | null;
  language: string;
  code: string;
  status: "accepted" | "partial" | "wrong_answer" | "runtime_error" | "compile_error" | "time_limit_exceeded";
  score: number;
  passedTestCases: number;
  totalTestCases: number;
  testResults: Array<{
    testCaseIndex: number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    executionTime: number;
    isHidden: boolean;
    error?: string;
  }>;
  submittedAt: string;
  submissionId?: string; // Optional submission ID from database
}

// Submit problem solution (legacy - no longer used)
export async function submitProblem(
  problemId: string,
  code: string,
  language: string
): Promise<ApiResponse<SubmissionResult>> {
  const url = `${API_CONFIG.ELEARN_API_URL}${API_ENDPOINTS.ELEARN.PROBLEMS.BY_ID(problemId)}/submit`;
  console.log("Submit API URL:", url);
  console.log("Submit payload:", { code: code.substring(0, 100) + "...", language });
  
  const response = await apiRequest<SubmissionResult>(
    url,
    {
      method: "POST",
      body: JSON.stringify({ code, language }),
    }
  );
  
  console.log("Submit API response:", response);
  return response;
}

// Save submission to database
export async function saveSubmission(
  submissionData: Omit<SubmissionResult, "submittedAt"> & { submittedAt?: string }
): Promise<ApiResponse<any>> {
  return apiRequest(
    `${API_CONFIG.ELEARN_API_URL}/submissions`,
    {
      method: "POST",
      body: JSON.stringify(submissionData),
    }
  );
}

// Get user's submission history
export async function getUserSubmissions(
  page = 1,
  limit = 20,
  filters: {
    problemId?: string;
    status?: string;
    language?: string;
    sort?: string;
  } = {}
): Promise<ApiResponse<any>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== "")
    ),
  });

  return apiRequest(
    `${API_CONFIG.ELEARN_API_URL}/submissions?${params}`
  );
}

// Get submission by ID
export async function getSubmissionById(
  submissionId: string
): Promise<ApiResponse<any>> {
  return apiRequest(
    `${API_CONFIG.ELEARN_API_URL}/submissions/${submissionId}`
  );
}

// Get user submission statistics  
export async function getUserSubmissionStats(): Promise<ApiResponse<any>> {
  return apiRequest(
    `${API_CONFIG.ELEARN_API_URL}/submissions/stats`
  );
}

// Example usage:
// const response = await getAllProblems(1, 10, { rank: "A", search: "binary" });
// if (response.success) {
//   const problems = response.data.problems;
// } else {
//   const error = response.error;
// }
