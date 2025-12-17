import { API_CONFIG, AUTH_STORAGE_KEY, getApiUrl } from "@/config/apiConfig";
import {
  UserPreferences,
  UpdateUserPreferencesDto,
  LimitIntakes,
} from "@/types/user";

class PreferencesService {
  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.USER_PREFERENCES.GET_BY_USER);
      const response = await this.authenticatedFetch(url);
      const data = await response.json();
      return data !== undefined ? data : null;
    } catch (error) {
      console.error("Get preferences error:", error);
      return null;
    }
  }

  async getLimitIntake(): Promise<LimitIntakes | null> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.USER_PREFERENCES.GET_LIMITS);
      const response = await this.authenticatedFetch(url);
      const data = await response.json();
      return data !== undefined ? data : null;
    } catch (error) {
      console.error("Get limits error:", error);
      return null;
    }
  }

  async updatePreferences(
    updateDto: UpdateUserPreferencesDto
  ): Promise<UserPreferences | null> {
    try {
      const url = getApiUrl(
        API_CONFIG.ENDPOINTS.USER_PREFERENCES.PATCH_BY_USER
      );
      const response = await this.authenticatedFetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateDto),
      });
      const data = await response.json();
      return data !== undefined ? data : null;
    } catch (error) {
      console.error("Update preferences error:", error);
      return null;
    }
  }

  async upsertPreferences(
    updateDto: UpdateUserPreferencesDto
  ): Promise<UserPreferences | null> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.USER_PREFERENCES.PUT_BY_USER);
      const response = await this.authenticatedFetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateDto),
      });
      const data = await response.json();
      return data !== undefined ? data : null;
    } catch (error) {
      console.error("Upsert preferences error:", error);
      return null;
    }
  }

  async deletePreferences(): Promise<UserPreferences | null> {
    try {
      const url = getApiUrl(
        API_CONFIG.ENDPOINTS.USER_PREFERENCES.DELETE_BY_USER
      );
      const response = await this.authenticatedFetch(url, {
        method: "DELETE",
      });
      const data = await response.json();
      return data !== undefined ? data : null;
    } catch (error) {
      console.error("Delete preferences error:", error);
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

export const preferencesService = new PreferencesService();
export default preferencesService;
