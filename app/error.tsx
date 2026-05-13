"use client"

import { useEffect } from "react"
import { RefreshCcw, AlertTriangle, ArrowRight } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error securely to the console
    console.error("[MindSync App Error Boundary]:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F5F5DC] text-gray-800 selection:bg-[#FF8A65]/30">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        
        {/* Alert Icon Bubble */}
        <div className="relative mx-auto w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF8A65]/20 to-[#FFB74D]/20 blur-2xl animate-pulse" />
          <div className="relative z-10 flex items-center justify-center w-32 h-32 rounded-3xl bg-white shadow-xl border border-white/40">
            <AlertTriangle className="w-16 h-16 text-[#FF8A65] stroke-[1.5] animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Text Elements */}
        <div className="space-y-3">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A65] to-[#6C63FF]">
            System Blip
          </h1>
          <h2 className="text-xl font-bold text-[#1F2F4A]">
            Thoughts briefly disconnected.
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-[340px] mx-auto">
            Our synchronization had a brief hiccup. We stored the error and are ready to try re-syncing.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button 
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-[#1F2F4A] text-white px-8 py-4 rounded-2xl font-medium shadow-lg shadow-[#1F2F4A]/20 hover:bg-[#263a5c] hover:shadow-[#1F2F4A]/30 transition-all duration-300 group w-full sm:w-auto"
          >
            <RefreshCcw className="w-5 h-5 opacity-80 group-hover:rotate-180 transition-transform duration-500" />
            Try Re-Syncing
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Secure code output for dev purposes */}
        {error.digest && (
          <p className="text-[10px] font-mono text-gray-400 opacity-50 tracking-wider">
            ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
