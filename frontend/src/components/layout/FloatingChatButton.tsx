"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";

const FloatingChatButton: React.FC = () => {
  const pathname = usePathname();

  // Don't show on chat page
  if (pathname === "/chat") {
    return null;
  }

  return (
    <Link
      href="/chat"
      className="fixed bottom-24 right-6 md:bottom-10 md:right-10 bg-black dark:bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-40 group"
    >
      <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
    </Link>
  );
};

export default FloatingChatButton;
