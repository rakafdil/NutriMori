"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from "lucide-react";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import { validatePassword } from "@/utils/passwordValidator";
import { userService } from "@/services/user.service";

const AuthPage: React.FC = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkPreferences = async () => {
    try {
      const prefs = await userService.checkPreference();
      if (prefs) {
        return prefs;
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Profile error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password strength for signup
    if (!isLogin && !validatePassword(formData.password)) {
      setError("Password does not meet the requirements");
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (isLogin) {
        // Login
        response = await authService.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        // Signup
        response = await authService.signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }

      // If service returned an error message, show it in UI
      if (!response || response.success === false) {
        setError(
          response?.message || "An unexpected error occurred. Please try again."
        );
        return;
      }

      // Success branch
      setError("");
      const prefs = await checkPreferences();

      if (prefs?.isFillingPreferences) {
        window.location.href = "/dashboard";
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Quick presence check first (avoid API call if no token)
        if (!authService.isAuthenticated()) {
          router.replace("/auth");
          setIsChecking(false);
          return;
        }

        // Verify token validity (this may refresh token internally)
        const tokenValid = await authService.verifyToken();
        if (!tokenValid) {
          router.replace("/auth");
          setIsChecking(false);
          return;
        }

        // Now check preferences status
        const prefs = await checkPreferences();

        // Determine "filled" conservatively:
        let filled = false;
        if (Array.isArray(prefs)) {
          filled = prefs.some(
            (p: any) =>
              p?.isFillingPreferences === true ||
              p?.isFillingPreferences === "True"
          );
        } else if (prefs && typeof prefs === "object") {
          filled =
            prefs.isFillingPreferences === true ||
            prefs.isFillingPreferences === "True";
        } else {
          // If the API returned a plain boolean or truthy value
          filled = prefs === true || prefs === "True";
        }

        // Single replace to chosen route (replace avoids polluting history)
        if (filled) {
          window.location.href = "/dashboard";
        } else {
          router.replace("/onboarding");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.replace("/auth");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 flex relative overflow-hidden transition-colors duration-500">
      {/* Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950/20 -z-10" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-lime-200/30 dark:bg-lime-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-3xl" />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-start items-center p-12 relative">
        <div className="max-w-md">
          <Link
            href="/"
            className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-3xl tracking-tight mb-8"
          >
            <Image src={"/logo.svg"} width={30} height={30} alt="logo" />
            <span>NutriMori</span>
          </Link>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Mulai perjalanan sehatmu hari ini
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Bergabung dengan pengguna yang telah mengubah hidup mereka dengan
            tracking nutrisi yang cerdas.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI-Powered Insights
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dapatkan analisis mendalam tentang pola makanmu
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Smart Tracking
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Catat makananmu dengan mudah dan cepat
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Personalized Goals
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rencana yang disesuaikan dengan kebutuhanmu
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-2xl tracking-tight mb-8"
          >
            <Image src={"/logo.svg"} width={30} height={30} alt="logo" />
            <span>NutriMori</span>
          </Link>

          {/* Form Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-8 md:p-10">
            {/* Toggle Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 dark:bg-gray-900 p-1 rounded-full">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-full font-semibold transition-all ${
                  isLogin
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-full font-semibold transition-all ${
                  !isLogin
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Sign Up
              </button>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isLogin ? "Welcome back!" : "Create account"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isLogin
                ? "Login untuk melanjutkan tracking nutrisimu"
                : "Daftar dan mulai perjalanan sehatmu"}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Sign Up Only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition"
                      required={!isLogin}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 dark:text-white transition ${
                      !isLogin &&
                      formData.password &&
                      !validatePassword(formData.password)
                        ? "border-red-300 dark:border-red-800 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500"
                    }`}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {!isLogin && (
                  <PasswordStrengthIndicator
                    password={formData.password}
                    showRequirements={
                      passwordFocused || formData.password.length > 0
                    }
                  />
                )}
              </div>

              {/* Confirm Password (Sign Up Only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-xl focus:outline-none focus:ring-2 dark:text-white transition ${
                        formData.confirmPassword &&
                        formData.password !== formData.confirmPassword
                          ? "border-red-300 dark:border-red-800 focus:ring-red-500"
                          : "border-gray-200 dark:border-gray-700 focus:ring-emerald-500"
                      }`}
                      required={!isLogin}
                      disabled={isLoading}
                    />
                  </div>
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Passwords do not match
                      </p>
                    )}
                </div>
              )}

              {/* Remember Me / Forgot Password */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  (!isLogin && !validatePassword(formData.password)) ||
                  (!isLogin && formData.password !== formData.confirmPassword)
                }
                className="group w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {isLogin ? "Logging in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Login" : "Create Account"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Google
              </span>
            </button>
          </div>

          {/* Footer Links */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              disabled={isLoading}
            >
              {isLogin ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
