"use client";
import React, { useState } from "react";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import ManifestoSection from "./ManifestoSection";
import PricingSection from "./PricingSection";

const HeroContent: React.FC = () => {
  const [currentSection, setCurrentSection] = useState("home");

  const sections = {
    home: <HeroSection />,
    features: <FeaturesSection />,
    manifesto: <ManifestoSection />,
    pricing: <PricingSection />,
  };

  const handleNavigate = (section: string) => {
    setCurrentSection(section);
  };

  return (
    <div className="relative w-full">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <Navbar onNavigate={handleNavigate} currentSection={currentSection} />
      </div>

      <div className="pt-20">
        <div
          className="transition-all duration-500 ease-in-out"
          style={{
            opacity: 1,
            transform: "translateX(0)",
          }}
        >
          {sections[currentSection as keyof typeof sections] || <HeroSection />}
        </div>
      </div>
    </div>
  );
};

export default HeroContent;
