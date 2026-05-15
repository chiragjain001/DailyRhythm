import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { LoadingProvider } from "@/contexts/loading-context"
import { Toaster } from "@/components/ui/sonner"
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration"
import { AuthProvider } from "@/components/AuthProvider"
export const metadata: Metadata = {
  title: "DailyRhythm",
  description: "DailyRhythm - Your productivity companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DailyRhythm",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-icon-180.png",
  },
  metadataBase: new URL("https://dailyrhythms.vercel.app"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dailyrhythms.vercel.app",
    title: "DailyRhythm",
    description: "DailyRhythm - Your productivity companion",
    siteName: "DailyRhythm",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "DailyRhythm - Mental Health & Productivity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DailyRhythm",
    description: "DailyRhythm - Your productivity companion",
    images: ["/mind.jpg"],
  },
}

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LoadingProvider>
          <AuthProvider>
            <ServiceWorkerRegistration />
            {children}
            <Toaster />
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  )
}
