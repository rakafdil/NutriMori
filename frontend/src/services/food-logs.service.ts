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
  // field lain
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

// --- Service Implementation ---

export const FoodLogsService = {
  /**
   * Create standard log (POST /food-logs)
   */
  create: async (data: CreateFoodLogDto) => {
    try {
      const response = await fetch(
        getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.CREATE),
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Log food input specialized (POST /food-logs/log)
   */
  logFood: async (input: LogFoodInputDto) => {
    try {
      const response = await fetch(
        getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.LOG),
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Log food input specialized (POST /food-logs/log)
   */
  logFoodItem: async (input: CreateFoodLogItemDto) => {
    try {
      const response = await fetch(
        getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.CREATE_ITEM),
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all logs with filters (GET /food-logs/lists)
   */
  findAll: async (params?: FoodLogFilterParams) => {
    try {
      const url = new URL(getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.LIST));

      if (params?.startDate)
        url.searchParams.append("startDate", params.startDate);
      if (params?.endDate) url.searchParams.append("endDate", params.endDate);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });
      console.log(response);
      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get daily summary (GET /food-logs/daily)
   */
  getDailySummary: async (date?: string) => {
    try {
      const url = new URL(
        getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.DAILY_BY_USER)
      );
      if (date) url.searchParams.append("date", date);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get weekly summary (GET /food-logs/weekly)
   */
  getWeeklySummary: async (endDate?: string) => {
    try {
      const url = new URL(
        getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.WEEKLY_BY_USER)
      );
      if (endDate) url.searchParams.append("endDate", endDate);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get streaks (GET /food-logs/streaks)
   */
  getStreaks: async (endDate?: string) => {
    try {
      const url = new URL(getApiUrl(API_CONFIG.ENDPOINTS.FOOD_LOGS.STREAKS));
      if (endDate) url.searchParams.append("endDate", endDate);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get single log (GET /food-logs/:id)
   */
  findOne: async (id: string) => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.FOOD_LOGS.GET_BY_ID.replace(
        ":id",
        id
      );
      const response = await fetch(getApiUrl(endpoint), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update log (PATCH /food-logs/:id)
   */
  update: async (id: string, data: UpdateFoodLogDto) => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.FOOD_LOGS.PATCH_BY_ID.replace(
        ":id",
        id
      );
      const response = await fetch(getApiUrl(endpoint), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove log (DELETE /food-logs/:id)
   */
  remove: async (id: string) => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.FOOD_LOGS.DELETE_BY_ID.replace(
        ":id",
        id
      );
      const response = await fetch(getApiUrl(endpoint), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw await response.json();
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
