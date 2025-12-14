import {
  HabitInsightsResponse,
  PatternSummaryData,
  HealthScoreHistoryData,
  HabitInsightsPeriod,
  HabitInsightsQueryParams,
} from "@/types/habitInsights";
import { API_CONFIG, AUTH_STORAGE_KEY, getApiUrl } from "@/config/apiConfig";

class HabitInsightsService {
  // Helper: Read auth token
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY);
    } catch (_err) {
      return null;
    }
  }

  // Helper: Authenticated fetch wrapper
  private async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getAuthToken();

    const headers = {
      "Content-Type": "application/json",
      ...((options && options.headers) || {}),
    } as Record<string, string>;

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
      credentials: "include",
    };

    return fetch(url, fetchOptions);
  }

  // Helper: Handle response errors
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let text = response.statusText;
      try {
        const errJson = await response.json();
        text = JSON.stringify(errJson) || text;
      } catch {
        // ignore JSON parse error
      }
      throw new Error(text);
    }
    return response.json();
  }

  // 1. GET Habit Insights (Main Analysis)
  async getHabitInsights(
    params: HabitInsightsQueryParams
  ): Promise<HabitInsightsResponse> {
    const base = getApiUrl(API_CONFIG.ENDPOINTS.HABIT_INSIGHTS.LIST);

    const queryParams = new URLSearchParams();
    queryParams.append("period", params.period);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const url = `${base}?${queryParams.toString()}`;

    const response = await this.authenticatedFetch(url, {
      method: "GET",
    });

    return this.handleResponse<HabitInsightsResponse>(response);
  }

  // 2. POST Refresh Insight (Force Regenerate)
  async refreshHabitInsights(
    period: HabitInsightsPeriod
  ): Promise<HabitInsightsResponse> {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.HABIT_INSIGHTS.REFRESH);

    const body = {
      period,
      forceRefresh: true,
    };

    const response = await this.authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return this.handleResponse<HabitInsightsResponse>(response);
  }

  // 3. DELETE Invalidate Cache
  async invalidateCache(period?: HabitInsightsPeriod): Promise<void> {
    const base = getApiUrl(API_CONFIG.ENDPOINTS.HABIT_INSIGHTS.CACHE);

    let url = base;
    if (period) {
      const queryParams = new URLSearchParams();
      queryParams.append("period", period);
      url = `${base}?${queryParams.toString()}`;
    }

    const response = await this.authenticatedFetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to clear cache");
    }
  }

  // 4. GET Pattern Summary (Lightweight)
  async getPatternSummary(
    period: HabitInsightsPeriod
  ): Promise<PatternSummaryData> {
    const base = getApiUrl(API_CONFIG.ENDPOINTS.HABIT_INSIGHTS.PATTERNS);

    const queryParams = new URLSearchParams();
    queryParams.append("period", period);

    const url = `${base}?${queryParams.toString()}`;

    const response = await this.authenticatedFetch(url, {
      method: "GET",
    });

    return this.handleResponse<PatternSummaryData>(response);
  }

  // 5. GET Health Score History
  async getHealthScoreHistory(
    months: number = 6
  ): Promise<HealthScoreHistoryData> {
    const base = getApiUrl(API_CONFIG.ENDPOINTS.HABIT_INSIGHTS.HISTORY);

    const queryParams = new URLSearchParams();
    queryParams.append("months", months.toString());

    const url = `${base}?${queryParams.toString()}`;

    const response = await this.authenticatedFetch(url, {
      method: "GET",
    });

    return this.handleResponse<HealthScoreHistoryData>(response);
  }
}

export const habitInsightsService = new HabitInsightsService();
export default habitInsightsService;
