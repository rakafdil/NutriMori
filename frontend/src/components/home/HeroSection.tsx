"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import Image from "next/image";

const HeroSection: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 flex flex-col relative overflow-hidden font-sans transition-colors duration-500">
      {/* Soft Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-emerald-50 via-white to-lime-50 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950/20 -z-10 transition-colors duration-500" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-lime-200/30 dark:bg-lime-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-3xl" />

      {/* Floating Food Images */}
      <div className="absolute h-full w-full z-0 opacity-80 mt-30">
        <div className="flex justify-between px-4 sm:px-10 md:px-20 lg:px-40 mb-10 md:mb-20">
          <Image
            src={"/hero/up-left.png"}
            width={200}
            height={200}
            alt="food"
            className="animate-spin-slow w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48"
          />
          <Image
            src={"/hero/up-right.png"}
            width={200}
            height={200}
            alt="food"
            className="animate-spin-slow w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48"
          />
        </div>
        <div className="flex justify-between px-2 sm:px-6 md:px-12 lg:px-20 mb-10 md:mb-20">
          <Image
            src={"/hero/mid-left.png"}
            width={150}
            height={150}
            alt="food"
            className="animate-spin-slower w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-28 lg:h-28 xl:w-36 xl:h-36"
          />
          <Image
            src={"/hero/mid-right.png"}
            width={150}
            height={150}
            alt="food"
            className="animate-spin-slower w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-28 lg:h-28 xl:w-36 xl:h-36"
          />
        </div>
        <div className="flex justify-between px-4 sm:px-10 md:px-20 lg:px-40">
          <Image
            src={"/hero/bot-left.png"}
            width={200}
            height={200}
            alt="food"
            className="animate-spin-slow w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48"
          />
          <Image
            src={"/hero/bot-right.png"}
            width={200}
            height={200}
            alt="food"
            className="animate-spin-slow w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col justify-center items-center text-center px-4 md:px-6 max-w-4xl mx-auto mt-10 md:mt-40">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-6 z-20">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-lime-600 dark:from-emerald-400 dark:to-lime-400">
            Kenali tubuhmu.
          </span>
          <br />
          Pahami kebiasaanmu.
          <br />
          Tingkatkan hidupmu.
        </h1>

        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Catat pola makanmu, biarkan AI membaca ceritanya, dan dapatkan insight
          yang bikin hidupmu makin terarah.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/auth"
            className="group flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20"
          >
            Start Tracking
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-8 py-4 rounded-full text-lg font-medium transition shadow-sm">
            <PlayCircle className="w-5 h-5 text-gray-400" />
            Lihat Demo
          </button>
        </div>

        {/* Abstract Floating UI Elements */}
        <div className="mt-16 w-full max-w-5xl relative h-64 md:h-80 opacity-90">
          <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/50 dark:border-gray-700 p-6 rounded-3xl shadow-2xl animate-fade-in-up transition-colors">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center text-xl">
                  🥑
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white">
                    Lunch Analysis
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Just now
                  </p>
                </div>
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-1 rounded-full font-bold">
                Health Score 92
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full w-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[80%]"></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                "Great balance of healthy fats and protein today!"
              </p>
            </div>
          </div>

          <div className="hidden md:block absolute left-[10%] top-[40px] bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg transform -rotate-6 animate-pulse-slow transition-colors">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
              🔥 420 kcal
            </p>
          </div>
          <div className="hidden md:block absolute right-[10%] top-[60px] bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg transform rotate-6 animate-pulse-slow delay-75 transition-colors">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
              💧 Low Sodium
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HeroSection;
