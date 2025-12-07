"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

interface NavbarProps {
  onNavigate?: (section: string) => void;
  currentSection?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentSection }) => {
  const navItems = ["home", "features", "manifesto", "pricing"];

  return (
    <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full">
      <Link
        href="/"
        className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xl tracking-tight"
      >
        <Image src={"/logo.svg"} width={30} height={30} alt="logo" />
        <span>NutriMori</span>
      </Link>
      <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => onNavigate?.(item)}
            className={`cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 transition capitalize ${
              currentSection === item
                ? "text-emerald-700 dark:text-emerald-300 font-semibold"
                : ""
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <Link
        href="/auth"
        className="bg-emerald-900 dark:bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-emerald-800 dark:hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/10"
      >
        Get Started
      </Link>
    </nav>
  );
};

export default Navbar;
