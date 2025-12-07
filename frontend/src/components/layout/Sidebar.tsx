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
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="bg-gradient-to-r from-emerald-900 to-gray-900 dark:from-gray-800 dark:to-black rounded-2xl p-4 text-white">
          <p className="text-xs font-medium opacity-70 mb-1">Pro Plan</p>
          <p className="text-sm font-bold mb-3">Unlock AI Recipes</p>
          <button className="w-full bg-white/20 hover:bg-white/30 text-xs py-2 rounded-lg transition">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
