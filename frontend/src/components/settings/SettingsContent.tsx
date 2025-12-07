"use client";
import React, { useState } from "react";
import { Moon, Sun, Bell, Shield, LogOut, Loader2 } from "lucide-react";
import { useUser, useTheme } from "@/context";
import { authService } from "@/services/auth.service";

const SettingsContent: React.FC = () => {
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setUser(null);
    authService.logout();
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in font-sans pb-24">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
        Settings
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-linear-to-br from-emerald-400 to-lime-400 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {user?.name?.[0] || "U"}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.name || "User"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Health Enthusiast
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Appearance */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-indigo-900/50 text-indigo-300"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {theme === "dark" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Dark Mode
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                theme === "dark" ? "bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  theme === "dark" ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-2xl cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                Notifications
              </span>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-2xl cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                Privacy & Data
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Signing Out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" /> Sign Out
              </>
            )}
          </button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-400 dark:text-gray-600 mt-12">
        NutriMori AI v1.0.0
      </div>
    </div>
  );
};

export default SettingsContent;
