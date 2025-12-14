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
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Client-side email validation
      if (!this.validateEmail(credentials.email)) {
        return {
          success: false,
          message: "Alamat email tidak valid.",
        };
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      // Try to parse JSON body (server may provide an explanatory message)
      let data: AuthResponse | any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log("Login response data:", data);

      if (response.ok && data?.data) {
        // Save tokens and user data
        if (data.data.access_token) {
          this.setAuthToken(data.data.access_token);
        }
        if (data.data.refresh_token) {
          this.setRefreshToken(data.data.refresh_token);
        }
        this.setUserData(data.data.user);
        return data;
      }

      // Map common server responses to user-friendly messages
      let message =
        (data && (data.message || data.error)) ||
        "Login gagal. Periksa email dan kata sandi Anda.";

      if (response.status === 401) {
        message = "Email atau kata sandi salah.";
      } else if (response.status === 400) {
        if (typeof message === "string") {
          const m = message.toLowerCase();
          if (m.includes("email")) message = "Alamat email tidak valid.";
          else if (m.includes("password")) message = "Kata sandi tidak valid.";
        }
      } else if (response.status === 429) {
        message = "Terlalu banyak percobaan. Coba lagi nanti.";
      } else if (response.status >= 500) {
        message = "Terjadi kesalahan di server. Silakan coba lagi nanti.";
      }

      return {
        success: false,
        message,
      };
    } catch (error: any) {
      console.error("Login error:", error);

      // Network errors (fetch throws TypeError on network failure in browsers)
      if (error instanceof TypeError) {
        return {
          success: false,
          message: "Kesalahan jaringan. Periksa koneksi Anda.",
        };
      }

      return {
        success: false,
        message: error?.message || "Terjadi kesalahan. Silakan coba lagi.",
      };
    }
  }
  // Signup new user
  // Signup new user
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      // Client-side email validation
      if (!this.validateEmail(credentials.email)) {
        return {
          success: false,
          message: "Invalid email address.",
        };
      }

      // Validate passwords match
      if (credentials.password !== credentials.confirmPassword) {
        return {
          success: false,
          message: "Passwords do not match.",
        };
      }

      // Validate password strength
      if (!validatePassword(credentials.password)) {
        return {
          success: false,
          message:
            "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.",
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

      // Attempt to parse JSON body (server may return helpful messages)
      let data: AuthResponse | any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log("Signup response data:", data);

      // Success path
      if (response.ok && data?.data) {
        if (data.data.access_token) {
          this.setAuthToken(data.data.access_token);
        }
        if (data.data.refresh_token) {
          this.setRefreshToken(data.data.refresh_token);
        }
        this.setUserData(data.data.user);
        return data;
      }

      // Map common server responses to user-friendly messages
      let message =
        (data && (data.message || data.error)) ||
        "Signup failed. Please check your input and try again.";

      if (response.status === 409) {
        message = "This email is already registered. Try logging in instead.";
      } else if (response.status === 400) {
        // If server message mentions email/password, make it clear
        if (typeof message === "string") {
          const m = message.toLowerCase();
          if (m.includes("email")) message = "Invalid email address.";
          else if (m.includes("password"))
            message = "Password does not meet requirements.";
        }
      } else if (response.status === 422 && data?.errors) {
        // Validation errors object -> join into one message
        const errs = data.errors;
        const joined = Object.values(errs)
          .flat()
          .map((v: any) => (typeof v === "string" ? v : JSON.stringify(v)))
          .join(" ");
        if (joined) message = joined;
      } else if (response.status >= 500) {
        message = "Server error. Please try again later.";
      }

      return {
        success: false,
        message,
      };
    } catch (error: any) {
      console.error("Signup error:", error);

      // Network errors (fetch throws TypeError on network failure in browsers)
      if (error instanceof TypeError) {
        return {
          success: false,
          message: "Network error. Please check your connection.",
        };
      }

      return {
        success: false,
        message:
          error?.message || "An unexpected error occurred. Please try again.",
      };
    }
  }

  // Add these helper methods inside the AuthService class:

  private validateEmail(email: string): boolean {
    if (!email) return false;
    // Simple but practical email regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(email);
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

    localStorage.clear();
    window.location.href = "/auth";
  }

  // Replace existing getAuthToken() with this
  getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    // If it's JSON, try to extract canonical token fields
    if (raw.startsWith("{") || raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "string") return parsed;
        if (parsed?.access_token && typeof parsed.access_token === "string") {
          return parsed.access_token;
        }
        if (parsed?.token && typeof parsed.token === "string") {
          return parsed.token;
        }
        // If it looks like a user object (id/email/name) it's invalid as auth token
        if (parsed?.id && (parsed?.email || parsed?.name)) {
          console.warn(
            "Found user object stored in AUTH_STORAGE_KEY — removing it."
          );
          localStorage.removeItem(AUTH_STORAGE_KEY);
          return null;
        }
      } catch (e) {
        // fallthrough to return raw
        console.debug("Failed to parse stored auth value:", e);
      }
    }

    return raw;
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
      credentials: "include",
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
