"use client";
import React from "react";
import { Heart, Target, Users, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const ManifestoSection: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 flex flex-col relative overflow-hidden font-sans transition-colors duration-500 py-20">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-lime-200/20 dark:bg-lime-900/10 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 w-full relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Manifesto Kami
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Kami percaya bahwa kesehatan adalah hak setiap orang. NutriMori
            hadir untuk membuat tracking nutrisi jadi mudah, personal, dan
            menyenangkan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-900/20 dark:to-lime-900/20 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 animate-fade-in">
            <Heart className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Kesehatan untuk Semua
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Teknologi AI yang canggih tidak harus mahal. Kami membuat tracking
              nutrisi accessible untuk semua orang, dari pelajar hingga
              profesional.
            </p>
          </div>

          <div
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/50 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <Target className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Personal & Presisi
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Setiap orang punya kebutuhan nutrisi yang berbeda. AI kami
              mempelajari pola makanmu dan memberikan rekomendasi yang truly
              personal.
            </p>
          </div>

          <div
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-8 rounded-3xl border border-purple-100 dark:border-purple-900/50 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <Users className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Community Driven
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Bergabung dengan komunitas yang saling support. Share progress,
              tips, dan motivasi untuk mencapai goal bersama.
            </p>
          </div>

          <div
            className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-8 rounded-3xl border border-orange-100 dark:border-orange-900/50 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <Sparkles className="w-12 h-12 text-orange-600 dark:text-orange-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Continuously Improving
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Kami terus berinovasi dan mendengarkan feedback pengguna. Setiap
              update membuat pengalaman tracking semakin baik.
            </p>
          </div>
        </div>

        <div
          className="text-center bg-emerald-600 dark:bg-emerald-700 text-white p-12 rounded-3xl animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <h3 className="text-3xl font-bold mb-4">Mulai Perjalanan Sehatmu</h3>
          <p className="text-lg mb-6 opacity-90">
            NutriMori sedang dibangun untuk membantu kamu memahami pola makanmu
            dengan cara yang lebih cerdas, personal, dan realistis.
          </p>
          <button
            onClick={() => router.push("/auth")}
            className="bg-white text-emerald-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition shadow-lg"
          >
            Mari Coba
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManifestoSection;
