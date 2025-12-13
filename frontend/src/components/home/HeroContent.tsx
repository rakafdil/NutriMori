"use client";
import React, { useEffect, useRef, useState } from "react";
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
    // pricing: <PricingSection />,
  };

  const handleNavigate = (section: string) => {
    setCurrentSection(section);
  };

  const SectionWrapper: React.FC<{ id: string; children: React.ReactNode }> = ({
    id,
    children,
  }) => {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      // initial state
      el.style.opacity = "0";
      el.style.transform = "translateX(20px)";

      // trigger transition on next frame
      requestAnimationFrame(() => {
        el.style.transition = "opacity 400ms ease, transform 400ms ease";
        el.style.opacity = "1";
        el.style.transform = "translateX(0)";
      });

      // optional cleanup: smooth exit (not required)
      return () => {
        if (!el) return;
        el.style.transition = "opacity 200ms ease, transform 200ms ease";
        el.style.opacity = "0";
        el.style.transform = "translateX(-10px)";
      };
    }, [id]);

    return (
      <div ref={ref} aria-hidden={false}>
        {children}
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <Navbar onNavigate={handleNavigate} currentSection={currentSection} />
      </div>

      <div className="pt-20">
        <SectionWrapper id={currentSection}>
          {sections[currentSection as keyof typeof sections] || <HeroSection />}
        </SectionWrapper>
      </div>
    </div>
  );
};

export default HeroContent;
