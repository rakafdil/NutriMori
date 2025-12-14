import { API_CONFIG, getApiUrl, getAuthHeaders } from "@/config/apiConfig";

// --- DTO Interfaces (Sesuaikan field dengan DTO Backend Anda) ---

export interface CreateFoodLogDto {
  mealType: string;
  foodItemId: string;
  quantity: number;
  unit: string;
  loggedAt?: string;
  // tambahkan field lain sesuai DTO backend
}

export interface LogFoodInputDto {
  text: string; // Misal untuk input natural language
  mealType?: "breakfast" | "lunch" | "dinner" | "snack"; // Added to match backend
}

export interface CreateFoodLogItemDto {
  logId: string;
  foodId?: number; // bigint in DB, so number here
  qty?: number;
  unit?: string;
  gram_weight?: number;
}

export interface UpdateFoodLogDto extends Partial<CreateFoodLogDto> {}

export interface FoodLogFilterParams {
  startDate?: string; // Format ISO Date String
  endDate?: string;
}

// Helper for retrying failed requests
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      // Return immediately for successful responses or last retry
      if (response.ok || i === retries) {
        return response;
      }
      // For non-ok responses that aren't the last retry, wait and continue
      lastError = new Error(`HTTP ${response.status}`);
      await new Promise((r) => setTimeout(r, 100 * Math.pow(2, i)));
    } catch (error) {
      lastError = error as Error;
      if (i === retries) throw error;
      await new Promise((r) => setTimeout(r, 100 * Math.pow(2, i)));
    }
  }
  throw lastError || new Error("Request failed after retries");
};

// --- Service Implementation ---

export const FoodLogsService = {
  /**
   * Create standard log (POST /food-logs)
   */
  create: async (data: CreateFoodLogDto) => {
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.CREATE),
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create food log");
    }
    return await response.json();
  },

  /**
   * Log food input specialized (POST /food-logs/log)
   */
  logFood: async (input: LogFoodInputDto) => {
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.LOG),
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to log food");
    }
    return await response.json();
  },

  /**
   * Log food item (POST /food-logs/item)
   */
  logFoodItem: async (input: CreateFoodLogItemDto) => {
    const response = await fetchWithRetry(
      getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.CREATE_ITEM),
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to log food item");
    }
    return await response.json();
  },

  /**
   * Get all logs with filters (GET /food-logs/lists)
   */
  findAll: async (params?: FoodLogFilterParams) => {
    const url = new URL(getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.LIST));

    if (params?.startDate)
      url.searchParams.append("startDate", params.startDate);
    if (params?.endDate) url.searchParams.append("endDate", params.endDate);

    const response = await fetchWithRetry(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch food logs");
    }

    const data = await response.json();
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get daily summary (GET /food-logs/daily)
   */
  getDailySummary: async (date?: string) => {
    const url = new URL(
      getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.DAILY_BY_USER)
    );
    if (date) url.searchParams.append("date", date);

    const response = await fetchWithRetry(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to get daily summary");
    }
    return await response.json();
  },

  /**
   * Get streaks (GET /food-logs/streaks)
   */
  getStreaks: async (endDate?: string) => {
    const url = new URL(getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.STREAKS));
    if (endDate) url.searchParams.append("endDate", endDate);

    const response = await fetchWithRetry(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to get streaks");
    }
    return await response.json();
  },

  /**
   * Get weekly summary (GET /food-logs/weekly)
   */
  getWeeklySummary: async (endDate?: string) => {
    const url = new URL(
      getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.WEEKLY_BY_USER)
    );
    if (endDate) url.searchParams.append("endDate", endDate);

    const response = await fetchWithRetry(url.toString(), {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to get weekly summary");
    }
    return await response.json();
  },

  /**
   * Get single log (GET /food-logs/:id)
   */
  findOne: async (id: string) => {
    const endpoint = API_CONFIG.ENDPOINTS.FOOD_LOGS.GET_BY_ID.replace(
      ":id",
      id
    );
    const response = await fetchWithRetry(getApiUrl(endpoint), {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to get food log");
    }
    return await response.json();
  },

  /**
   * Update log (PATCH /food-logs/:id)
   */
  update: async (id: string, data: UpdateFoodLogDto) => {
    const endpoint = API_CONFIG.ENDPOINTS.FOOD_LOGS.PATCH_BY_ID.replace(
      ":id",
      id
    );
    const response = await fetchWithRetry(getApiUrl(endpoint), {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update food log");
    }
    return await response.json();
  },

  /**
   * Remove log (DELETE /food-logs/:id)
   */
  remove: async (id: string) => {
    const endpoint = API_CONFIG.ENDPOINTS.FOOD_LOGS.DELETE_BY_ID.replace(
      ":id",
      id
    );
    const response = await fetchWithRetry(getApiUrl(endpoint), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete food log");
    }
    return await response.json();
  },
};
