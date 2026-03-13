export const API_CONFIG = {
  // Base URLs for different services
  AUTH_API_URL: process.env.AUTH_API_URL || "http://localhost:3000/api/auth",
  AUTHZ_API_URL: process.env.AUTHZ_API_URL || "http://localhost:3000/api/authz",
  ELEARN_API_URL:
    process.env.ELEARN_API_URL || "http://localhost:3000/api/elearn",

  // Common settings
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// API endpoints for different services
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    REFRESH_TOKEN: "/refresh-token",
    LOGOUT: "/logout",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },

  // Authz endpoints
  AUTHZ: {
    CHECK_PERMISSION: "/check",
    GET_ROLES: "/roles",
  },

  // Elearn endpoints
  ELEARN: {
    COURSES: {
      BASE: "/courses",
      BY_ID: (id: string) => `/courses/${id}`,
      ENROLL: (id: string) => `/courses/${id}/enroll`,
    },
    LESSONS: {
      BASE: (courseId: string) => `/courses/${courseId}/lessons`,
      BY_ID: (id: string) => `/lessons/${id}`,
    },
    PROBLEMS: {
      BASE: "/problems",
      BY_ID: (id: string) => `/problems/${id}`,
      STATS: "/problems/stats",
    },
  },
} as const;
