"use client"

import Link from "next/link"
import { Home, Compass, ArrowRight } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F5F5DC] text-gray-800 selection:bg-[#FF8A65]/30">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        
        {/* Premium Floating SVG Illustration */}
        <div className="relative mx-auto w-48 h-48 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFB74D]/20 to-[#6C63FF]/20 blur-2xl animate-pulse" />
          <div className="relative z-10 flex items-center justify-center w-32 h-32 rounded-3xl bg-white shadow-xl border border-white/40">
            <Compass className="w-16 h-16 text-[#FF8A65] stroke-[1.5] animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          {/* Decorative nodes floating around */}
          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#6C63FF] opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-[#FFB74D] opacity-60 animate-bounce" style={{ animationDelay: '1s' }} />
        </div>

        {/* Text Elements */}
        <div className="space-y-3">
          <h1 className="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF8A65] to-[#6C63FF]">
            404
          </h1>
          <h2 className="text-2xl font-bold">
            Lost your <span style={{ background: 'linear-gradient(180deg, #A4DB66, #2F95A3, #3C4E91)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Daily</span><span style={{ background: 'linear-gradient(180deg, #FAD961, #F7A93B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Rythm</span>?
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-[320px] mx-auto">
            The path you took isn't synchronized with our active thoughts. Let's find your focus again.
          </p>
        </div>

        {/* Navigation Button */}
        <div className="pt-4">
          <Link href="/dashboard">
            <button className="inline-flex items-center justify-center gap-2 bg-[#1F2F4A] text-white px-8 py-4 rounded-2xl font-medium shadow-lg shadow-[#1F2F4A]/20 hover:bg-[#263a5c] hover:shadow-[#1F2F4A]/30 transition-all duration-300 group w-full sm:w-auto">
              <Home className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
              Back to Dashboard
              <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>

        {/* Bottom signature line */}
        <p className="text-xs text-gray-400 opacity-70">
          DailyRythm &middot; Syncing your thoughts.
        </p>
      </div>
    </div>
  )
}
