import {
  HabitInsightsParams,
  HabitInsightsResponse,
} from "@/types/habitInsights";
import { API_CONFIG, AUTH_STORAGE_KEY, getApiUrl } from "@/config/apiConfig";

class HabitInsightsService {
  // Build URL for habit insights; prefer configured endpoint, fallback to BASE_URL
  private buildUrl(params?: HabitInsightsParams) {
    const base =
      API_CONFIG && (API_CONFIG as any).ENDPOINTS?.HABIT_INSIGHTS
        ? getApiUrl((API_CONFIG as any).ENDPOINTS.HABIT_INSIGHTS)
        : `${API_CONFIG.BASE_URL}/habit-insights`;

    if (!params) return base;

    const queryParams = new URLSearchParams();
    queryParams.append("period", params.period);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    return `${base}?${queryParams.toString()}`;
  }

  // read auth token from storage (non-httpOnly fallback)
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY);
    } catch (_err) {
      return null;
    }
  }

  // do authenticated fetch — if token exists, send Authorization header,
  // otherwise rely on browser cookies by setting credentials: 'include'
  private async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getAuthToken();

    // build headers, preserving any provided headers
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

  // public method to get habit insights
  async getHabitInsights(
    params: HabitInsightsParams
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

    if (!response.ok) {
      let text = response.statusText;
      try {
        const errJson = await response.json();
        // console.log(errJson);
        text = JSON.stringify(errJson) || text;
      } catch {
        // ignore
      }
      throw new Error(text);
    }

    return response.json();
  }
}

export const habitInsightsService = new HabitInsightsService();
export default habitInsightsService;
