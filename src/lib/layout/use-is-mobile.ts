"use client";

import { useEffect, useState } from "react";
import { mediaQueries } from "@/lib/layout/responsive";

/**
 * True on phone-sized viewports (iPhone, narrow Android).
 * Tablet (768px+) and desktop use the existing sidebar layout.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(mediaQueries.mobilePhone).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(mediaQueries.mobilePhone);

    function handleChange(event: MediaQueryListEvent | MediaQueryList) {
      setIsMobile(event.matches);
    }

    handleChange(mq);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
