"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = elementRef.current;

    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -48px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className={`motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible
          ? "motion-safe:translate-y-0 motion-safe:scale-100 motion-safe:opacity-100"
          : "motion-safe:translate-y-7 motion-safe:scale-[0.985] motion-safe:opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
