"use client";
import { useEffect } from "react";

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Add passive touch listeners to improve scroll performance
    document.querySelectorAll("*").forEach(el => {
      el.addEventListener?.("touchstart", () => {}, { passive: true });
    });
    
    // Preconnect to Google Fonts for faster loading
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://fonts.gstatic.com";
    document.head.appendChild(link);
  }, []);
  return null;
}
