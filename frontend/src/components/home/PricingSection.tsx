"use client";
import React from "react";
import { Check, Zap } from "lucide-react";
import Link from "next/link";

const PricingSection: React.FC = () => {
  const plans = [
    {
      name: "Free",
      price: "Rp 0",
      period: "/bulan",
      description: "Perfect untuk memulai",
      features: [
        "Track unlimited meals",
        "AI nutrition analysis",
        "Basic insights",
        "7 days history",
        "Community access",
      ],
      cta: "Mulai Gratis",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "Rp 49k",
      period: "/bulan",
      description: "Untuk yang serius dengan kesehatan",
      features: [
        "Everything in Free",
        "Advanced AI insights",
        "Unlimited history",
        "Custom meal plans",
        "Priority support",
        "Export data",
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
    },
    {
      name: "Premium",
      price: "Rp 99k",
      period: "/bulan",
      description: "Maximum features & support",
      features: [
        "Everything in Pro",
        "Personal nutritionist chat",
        "Custom recipe recommendations",
        "Family sharing (5 accounts)",
        "Advanced analytics",
        "API access",
        "White-label option",
      ],
      cta: "Go Premium",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col relative overflow-hidden font-sans transition-colors duration-500 py-20">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Pilih Plan yang{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-lime-600">
              Sesuai
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Mulai gratis, upgrade kapan saja. Tidak ada komitmen jangka panjang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 rounded-3xl p-8 border-2 transition-all duration-300 transform hover:-translate-y-2 animate-fade-in ${
                plan.highlighted
                  ? "border-emerald-500 dark:border-emerald-600 shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/50 relative"
                  : "border-gray-200 dark:border-gray-700 hover:shadow-xl"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {plan.description}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth"
                className={`block w-full text-center py-3 rounded-xl font-bold transition ${
                  plan.highlighted
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Semua plan termasuk 14 hari money-back guarantee 💚</p>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
