"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, MessageSquare, User } from "lucide-react";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/analytics", icon: PieChart, label: "Analytics" },
  { href: "/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/settings", icon: User, label: "Profile" },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed h-full z-20 transition-colors duration-300">
      <div className="p-8">
        <Link href="/dashboard">
          <h1 className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight flex items-center gap-2">
            <div className="flex w-8 h-8 rounded-lg justify-center items-center">
              <Image
                src={"logo.svg"}
                width={20}
                height={20}
                alt="logo"
                className="object-cover w-fit h-fit"
              />
            </div>
            NutriMori
          </h1>
        </Link>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
