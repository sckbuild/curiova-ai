"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type NavVariant = "dark" | "light" | "auto";

interface NavbarProps {
  variant?: NavVariant;
}

const NAV_TABS = [
  { label: "Home", href: "/" },
  { label: "Parent Setup", href: "/onboarding" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Child Flow", href: "/learn" },
];

export function Navbar({ variant = "dark" }: NavbarProps) {
  const [isDark, setIsDark] = useState(variant !== "light");
  const [scrolled, setScrolled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (variant !== "auto") {
      setIsDark(variant === "dark");
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Observe cream/light sections to switch theme
    const lightSections = document.querySelectorAll(
      "[data-nav-theme='light']"
    );
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const anyLight = entries.some(
          (e) => e.isIntersecting && e.intersectionRatio > 0.3
        );
        setIsDark(!anyLight);
      },
      { threshold: [0, 0.3, 0.7, 1], rootMargin: "-60px 0px 0px 0px" }
    );

    lightSections.forEach((el) => observerRef.current?.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observerRef.current?.disconnect();
    };
  }, [variant]);

  const textColor = isDark ? "text-cream" : "text-ink";
  const mutedColor = isDark ? "text-white/40" : "text-muted";
  const bg = scrolled
    ? isDark
      ? "bg-ink/90 backdrop-blur-md border-b border-white/6"
      : "bg-white/90 backdrop-blur-md border-b border-ink/8"
    : "bg-transparent";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center px-6 transition-all duration-300 ${bg}`}
    >
      {/* Wordmark */}
      <Link
        href="/"
        className={`font-display font-bold text-lg flex items-baseline gap-0 shrink-0 ${textColor}`}
      >
        curio
        <span className="text-coral">·</span>
        va
        <span className={`text-xs font-body ml-0.5 ${mutedColor}`}>.ai</span>
      </Link>

      {/* Center tabs */}
      <div className="hidden md:flex items-center gap-1 mx-auto">
        {NAV_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-full text-sm font-body transition-all duration-150 ${
              isDark
                ? "text-white/60 hover:text-white hover:bg-white/10"
                : "text-ink/50 hover:text-ink hover:bg-ink/8"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/onboarding"
        className="ml-auto shrink-0 bg-coral text-white text-sm font-body font-medium px-5 py-2 rounded-full hover:bg-[#e6441f] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
      >
        Get started →
      </Link>
    </nav>
  );
}
