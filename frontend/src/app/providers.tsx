"use client";
import { ReactNode } from "react";
import { UserProvider, ThemeProvider } from "@/context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  );
}
