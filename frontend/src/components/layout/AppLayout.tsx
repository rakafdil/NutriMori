"use client";
import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import FloatingChatButton from "./FloatingChatButton";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white md:bg-gray-50 dark:bg-gray-900 dark:md:bg-gray-950 flex transition-colors duration-300">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 md:ml-64 w-full relative overflow-x-hidden">
        <FloatingChatButton />
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
