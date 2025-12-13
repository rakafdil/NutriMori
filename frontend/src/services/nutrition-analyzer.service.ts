import { API_CONFIG, AUTH_STORAGE_KEY, getApiUrl } from "@/config/apiConfig";
import {
  CreateNutritionAnalysisDto,
  NutritionAnalysisResponse,
} from "@/types/nutritionAnalyzer";

class NutritionAnalyzerService {
  /**
   * Create a nutrition analysis for a given food log.
   * Method: POST
   * Flow: Trigger analysis calculation based on foodLogId
   */
  async createAnalysis(
    createDto: CreateNutritionAnalysisDto
  ): Promise<NutritionAnalysisResponse | null> {
    try {
      // Asumsi key config: API_CONFIG.ENDPOINTS.NUTRITION.CREATE
      // yang mengarah ke endpoint: /nutrition-analysis
      const url = getApiUrl(API_CONFIG.ENDPOINTS.NUTRITION.CREATE);

      const response = await this.authenticatedFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createDto),
      });

      const data = await response.json();
      return data !== undefined ? data : null;
    } catch (error) {
      console.error("Create nutrition analysis error:", error);
      return null;
    }
  }

  // --- Private Helper Methods (Sama persis dengan PreferencesService) ---
  /**
   * 2. Get Analysis By Food Log ID (GET)
   * URL: /nutrition-analysis/food-log/{foodLogId}
   */
  async getAnalysisByFoodLogId(
    foodLogId: string
  ): Promise<NutritionAnalysisResponse | null> {
    try {
      // Base URL: /nutrition-analysis/food-log
      const baseUrl = getApiUrl(API_CONFIG.ENDPOINTS.NUTRITION.GET_BY_FOOD_LOG);
      const url = `${baseUrl}/${foodLogId}`;

      const response = await this.authenticatedFetch(url, {
        method: "GET",
      });

      const data = await response.json();
      return data !== undefined ? data : null;
    } catch (error) {
      console.error("Get analysis by ID error:", error);
      return null;
    }
  }

  /**
   * 3. Get User Analysis History (GET)
   * URL: /nutrition-analysis/history?limit=10
   */
  async getAnalysisHistory(
    limit: number = 10
  ): Promise<NutritionAnalysisResponse[] | null> {
    try {
      // Base URL: /nutrition-analysis/history
      const baseUrl = getApiUrl(API_CONFIG.ENDPOINTS.NUTRITION.GET_HISTORY);
      // Menggunakan URLSearchParams untuk query string yang rapi
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
      });
      const url = `${baseUrl}?${queryParams.toString()}`;

      const response = await this.authenticatedFetch(url, {
        method: "GET",
      });

      const data = await response.json();
      // Pastikan return berupa array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Get analysis history error:", error);
      return null;
    }
  }

  // Get stored auth token
  private getAuthToken(): string | null {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  }

  // Make authenticated API call
  private async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const nutritionAnalyzerService = new NutritionAnalyzerService();
export default nutritionAnalyzerService;
