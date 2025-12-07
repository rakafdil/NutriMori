"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/index";
import { authService } from "@/services/auth.service";

export default function AppRouteLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = authService.isAuthenticated();

      if (!isAuthenticated) {
        router.push("/auth");
      } else {
        // Optionally verify token validity
        const isValid = await authService.verifyToken();
        if (!isValid) {
          router.push("/auth");
        }
      }

      setIsChecking(false);
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
