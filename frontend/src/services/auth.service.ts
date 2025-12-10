import {
  API_CONFIG,
  AUTH_STORAGE_KEY,
  REFRESH_STORAGE_KEY,
  USER_STORAGE_KEY,
  getApiUrl,
} from "@/config/apiConfig";
import { AuthResponse, LoginCredentials, SignupCredentials } from "@/types";
import { validatePassword } from "@/utils/passwordValidator";

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();
      console.log("Login response data:", data);

      if (response.ok && data.data) {
        // Save tokens and user data
        if (data.data.access_token) {
          this.setAuthToken(data.data.access_token);
        }
        if (data.data.refresh_token) {
          this.setRefreshToken(data.data.refresh_token);
        }
        this.setUserData(data.data.user);
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection.",
      };
    }
  }

  // Signup new user
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      // Validate passwords match
      if (credentials.password !== credentials.confirmPassword) {
        return {
          success: false,
          message: "Passwords do not match",
        };
      }

      // Validate password strength
      if (!validatePassword(credentials.password)) {
        return {
          success: false,
          message:
            "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character",
        };
      }

      const response = await fetch(
        getApiUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNUP),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: credentials.name,
            email: credentials.email,
            password: credentials.password,
          }),
          credentials: "include",
        }
      );

      const data: AuthResponse = await response.json();

      if (response.ok && data.data) {
        // Save tokens and user data
        if (data.data.access_token) {
          this.setAuthToken(data.data.access_token);
        }
        if (data.data.refresh_token) {
          this.setRefreshToken(data.data.refresh_token);
        }
        this.setUserData(data.data.user);
      }

      return data;
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection.",
      };
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(
        getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();

      if (data.success && data.data) {
        if (data.data.access_token) {
          this.setAuthToken(data.data.access_token);
        }
        if (data.data.refresh_token) {
          this.setRefreshToken(data.data.refresh_token);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }

  // Logout user
  logout(): void {
    const token = this.getAuthToken();

    // Call logout endpoint if token exists
    if (token) {
      fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(console.error);
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(REFRESH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = "/auth";
  }

  // Get stored auth token
  getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_STORAGE_KEY);
  }

  // Set auth token
  setAuthToken(token: string): void {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  }

  // Get stored refresh token
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_STORAGE_KEY);
  }

  // Set refresh token
  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_STORAGE_KEY, token);
  }

  // Get stored user data
  getUserData(): { id: string; email: string; name: string } | null {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Set user data
  setUserData(user: { id: string; email: string; name: string }): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Verify token validity
  async verifyToken(): Promise<boolean> {
    const token = this.getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(
        getApiUrl(API_CONFIG.ENDPOINTS.AUTH.VERIFY),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Try to refresh token if verification fails
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return true;
        }
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Token verification error:", error);
      return false;
    }
  }

  // Make authenticated API call with automatic token refresh
  async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // If unauthorized, try refreshing token
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();

      if (refreshed) {
        const newToken = this.getAuthToken();
        // Retry request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } else {
        this.logout();
        throw new Error("Session expired. Please login again.");
      }
    }

    return response;
  }
}

export const authService = new AuthService();
