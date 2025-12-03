"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, MessageSquare, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/analytics", icon: PieChart, label: "Analytics" },
  { href: "/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/settings", icon: User, label: "Profile" },
];

const MobileNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-50 px-6 py-2 pb-6 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              isActive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <item.icon
              className={`w-6 h-6 ${
                isActive ? "fill-emerald-100 dark:fill-emerald-900/50" : ""
              }`}
            />
            {isActive && (
              <span className="w-1 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full mt-1"></span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default MobileNav;
