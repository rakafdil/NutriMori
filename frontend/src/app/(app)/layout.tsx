"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/index";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";

export default function AppRouteLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  const checkPreferences = async () => {
    try {
      const prefs = await userService.checkPreference();
      return prefs ?? null;
    } catch (err) {
      console.error("Profile error:", err);
      return null;
    }
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
          router.replace("/dashboard");
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

  if (!authService.isAuthenticated()) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
