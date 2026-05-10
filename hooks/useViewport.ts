"use client";
import { useEffect, useState } from "react";

interface ViewportState {
  width: number;
  height: number;
  deviceType: "mobile" | "tablet" | "desktop";
  browser: "safari" | "chrome" | "firefox" | "edge" | "unknown";
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  breakpoint: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}

export function useViewport(): ViewportState {
  const [viewport, setViewport] = useState<ViewportState>({
    width: 0,
    height: 0,
    deviceType: "desktop",
    browser: "unknown",
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isPortrait: false,
    isLandscape: true,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
    breakpoint: "2xl",
  });

  useEffect(() => {
    const detectBrowser = () => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("edg/")) return "edge";
      if (ua.includes("safari") && !ua.includes("chrome")) return "safari";
      if (ua.includes("chrome")) return "chrome";
      if (ua.includes("firefox")) return "firefox";
      return "unknown";
    };

    const detectDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      return {
        isIOS: /iphone|ipad|ipod/.test(ua),
        isAndroid: /android/.test(ua),
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      };
    };

    const getBreakpoint = (width: number) => {
      if (width < 640) return "xs";
      if (width < 768) return "sm";
      if (width < 1024) return "md";
      if (width < 1280) return "lg";
      if (width < 1536) return "xl";
      return "2xl";
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const browser = detectBrowser();
      const device = detectDevice();
      
      const deviceType = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
      const isPortrait = h > w;
      const isLandscape = w > h;
      const breakpoint = getBreakpoint(w);

      setViewport({
        width: w,
        height: h,
        deviceType,
        browser,
        isMobile: deviceType === "mobile",
        isTablet: deviceType === "tablet",
        isDesktop: deviceType === "desktop",
        isPortrait,
        isLandscape,
        isTouchDevice: device.isTouchDevice,
        isIOS: device.isIOS,
        isAndroid: device.isAndroid,
        isSafari: browser === "safari",
        isChrome: browser === "chrome",
        isFirefox: browser === "firefox",
        isEdge: browser === "edge",
        breakpoint,
      });

      // Set CSS custom property for viewport height (iOS fix)
      document.documentElement.style.setProperty("--vh", `${h * 0.01}px`);
    };

    // Initial call
    handleResize();

    // Add event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return viewport;
}

// Default export for backward compatibility
export default useViewport;
