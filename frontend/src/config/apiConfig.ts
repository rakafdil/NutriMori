export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      SIGNUP: "/auth/signup",
      LOGOUT: "/auth/logout",
      REFRESH: "/auth/refresh",
      VERIFY: "/auth/verify",
    },
    USER: {
      PROFILE: "/user/profile",
      UPDATE: "/user/update",
    },
    MEALS: {
      LIST: "/meals",
      CREATE: "/meals/create",
      UPDATE: "/meals/update",
      DELETE: "/meals/delete",
    },
    NUTRITION: {
      ANALYZE: "/nutrition/analyze",
      INSIGHTS: "/nutrition/insights",
    },
  },
  TIMEOUT: 30000,
};

export const AUTH_STORAGE_KEY = "nutrimori_auth_token";
export const REFRESH_STORAGE_KEY = "nutrimori_refresh_token";
export const USER_STORAGE_KEY = "nutrimori_user";

// Helper function to get full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get headers with auth token
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(AUTH_STORAGE_KEY);
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
