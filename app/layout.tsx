import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { LoadingProvider } from "@/contexts/loading-context"
import { Toaster } from "sonner"
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration"

export const metadata: Metadata = {
  title: "MindSync",
  description: "MindSync - Your productivity companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MindSync",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-icon-180.png",
  },
  metadataBase: new URL("https://mindsync-five.vercel.app"),
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
    title: "MindSync",
    description: "MindSync - Your productivity companion",
    url: "https://mindsync-five.vercel.app",
    siteName: "MindSync",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MindSync",
    description: "MindSync - Your productivity companion",
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
          <ServiceWorkerRegistration />
          {children}
          <Toaster />
        </LoadingProvider>
      </body>
    </html>
  )
}
