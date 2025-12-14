"use client";
import React from "react";
import {
  Zap,
  Brain,
  TrendingUp,
  Camera,
  Clock,
  Shield,
  Database,
} from "lucide-react";

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "AI-Powered Analysis",
      description: "Analisis nutrisi otomatis dengan teknologi AI terkini",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Smart Insights",
      description: "Dapatkan insight personal berdasarkan pola makanmu",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Progress Tracking",
      description:
        "Pantau progress kesehatan kamu dengan rekomendasi yang harus dilakukan",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Food Database TKPI&USDA",
      description: "Cari makanan kamu dengan data yang terpercaya",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Data Privacy",
      description: "Data kesehatan kamu aman dan ter-enkripsi",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col relative overflow-hidden font-sans transition-colors duration-500 py-20">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Fitur yang{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-lime-600">
              Powerful
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Semua yang kamu butuhkan untuk tracking nutrisi yang efektif dan
            menyenangkan
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in flex flex-col items-center text-center md:items-start md:text-left"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`${feature.bg} ${feature.color} w-16 h-16 rounded-xl flex items-center justify-center mb-4`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
