export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      SIGNUP: "/auth/signup",
      LOGOUT: "/auth/logout",
      REFRESH: "/auth/refresh",
      VERIFY: "/auth/verify",
      CHANGE_PASSWORD: "/auth/change-password",
      RESET_PASSWORD_REQUEST: "/auth/reset-password-request",
      RESET_PASSWORD: "/auth/reset-password",
    },
    USER: {
      PROFILE: "/user/profile",
      UPDATE: "/user/update",
    },

    USERS: {
      GET_BY_ID: "/users/me",
      PATCH_BY_ID: "/users/me",
      DELETE_BY_ID: "/users/me",
      CHECK_PREFERENCE: "/users/check-preference",
    },

    MEALS: {
      LIST: "/meals",
      CREATE: "/meals/create",
      UPDATE: "/meals/update",
      DELETE: "/meals/delete",
    },

    FOOD_ITEMS: {
      CREATE: "/food-items",
      LIST: "/food-items",
      GET_BY_ID: "/food-items/:id",
      PATCH_BY_ID: "/food-items/:id",
      UPDATE_NUTRIENTS: "/food-items/:id/nutrients",
      ADD_CATEGORY: "/food-items/:id/categories",
      DELETE_CATEGORY: "/food-items/:id/categories/:categoryId",
      DELETE_BY_ID: "/food-items/:id",
    },

    FOOD_LOGS: {
      CREATE: "/food-logs", // sama kek log
      LOG: "/food-logs/log",
      LIST: "/food-logs/lists",
      GET_BY_ID: "/food-logs/:id",
      PATCH_BY_ID: "/food-logs/:id",
      DELETE_BY_ID: "/food-logs/:id",
      DAILY_BY_USER: "/food-logs/daily",
      WEEKLY_BY_USER: "/food-logs/weekly",
      STREAKS: "/food-logs/streaks",
    },

    NUTRITION: {
      ANALYZE: "/nutrition/analyze",
      INSIGHTS: "/nutrition/insights",
    },

    NUTRITION_RULES: {
      CREATE: "/nutrition-rules",
      LIST: "/nutrition-rules",
      GET_BY_NUTRIENT: "/nutrition-rules/nutrient/:nutrient",
      CHECK: "/nutrition-rules/check",
      GET_BY_ID: "/nutrition-rules/:id",
      PATCH_BY_ID: "/nutrition-rules/:id",
      DELETE_BY_ID: "/nutrition-rules/:id",
    },

    HABIT_INSIGHTS: {
      LIST: "/habit-insights",
    },

    USER_PREFERENCES: {
      BY_USER: "/user-preferences/",
      GET_BY_USER: "/user-preferences/",
      PUT_BY_USER: "/user-preferences/",
      PATCH_BY_USER: "/user-preferences/",
      DELETE_BY_USER: "/user-preferences/",
    },
  },
  TIMEOUT: 30000,
};

export const AUTH_STORAGE_KEY = "nutrimori_auth_token";
export const REFRESH_STORAGE_KEY = "nutrimori_refresh_token";
export const USER_STORAGE_KEY = "nutrimori_user";
export const PREFERENCES_STORAGE_KEY = "nutrimori_preferences";

// Helper function to get full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get headers with auth token
export const getAuthHeaders = (): HeadersInit => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(AUTH_STORAGE_KEY)
      : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
