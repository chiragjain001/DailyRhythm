import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import SupabaseProvider from "@/components/supabase-provider"
import { LoadingProvider } from "@/contexts/loading-context"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "MindSync",
  description: "MindSync - Your productivity companion",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <LoadingProvider>
            {children}
            <Toaster />
          </LoadingProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
