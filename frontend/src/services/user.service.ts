import { API_CONFIG, AUTH_STORAGE_KEY, getApiUrl } from "@/config/apiConfig";
import {
  User,
  UserPreferences,
  UpdateUserPreferencesDto,
  UpdateUserDto,
} from "@/types/user";

class UserService {
  // Get user profile
  async getProfile(): Promise<User | null> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.USERS.GET_BY_ID);
      const response = await this.authenticatedFetch(url);
      const data = await response.json();
      return data !== undefined ? data : null;
    } catch (error) {
      console.error("Get profile error:", error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(updateDto: UpdateUserDto): Promise<User | null> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.USERS.PATCH_BY_ID);
      const response = await this.authenticatedFetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateDto),
      });
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Update profile error:", error);
      return null;
    }
  }

  // Get user preferences
  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.USER_PREFERENCES.GET_BY_USER);
      const response = await this.authenticatedFetch(url);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Get preferences error:", error);
      return null;
    }
  }

  // Update or create user preferences
  async upsertPreferences(
    preferences: UpdateUserPreferencesDto
  ): Promise<UserPreferences | null> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.USER_PREFERENCES.PUT_BY_USER);
      const response = await this.authenticatedFetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Upsert preferences error:", error);
      return null;
    }
  }

  // returns user preferences check result (data) or null
  async checkPreference(): Promise<any | null> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.USERS.CHECK_PREFERENCE);
      const response = await this.authenticatedFetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Check preference error:", error);
      return null;
    }
  }

  // Get stored auth token
  private getAuthToken(): string | null {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  }

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
      // ensure cookies are sent (so HttpOnly cookie auth works). callers can override.
      credentials: (options && options.credentials) || "include",
    };

    return fetch(url, fetchOptions);
  }
}

export const userService = new UserService();
