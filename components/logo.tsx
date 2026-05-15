"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export function Logo({ className, size = 'md' }: { className?: string, size?: LogoSize }) {
  const sizeClasses: Record<LogoSize, { img: string, text: string, width: number, height: number }> = {
    sm: { img: 'h-6 w-6', text: 'text-sm', width: 24, height: 24 },
    md: { img: 'h-8 w-8', text: 'text-xl', width: 32, height: 32 }, // default for topbar
    lg: { img: 'h-8 w-8 sm:h-10 sm:w-10', text: 'text-xl sm:text-2xl', width: 40, height: 40 }, // for mobile auth and dashboard
    xl: { img: 'h-10 w-10 sm:h-12 sm:w-12', text: 'text-2xl sm:text-3xl', width: 48, height: 48 }, // for desktop auth
    '2xl': { img: 'h-16 w-16', text: 'text-4xl', width: 64, height: 64 }, // for dashboard if needed
    '3xl': { img: 'h-24 w-24', text: 'text-6xl', width: 96, height: 96 },
  };

  const s = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="DailyRythm Logo"
        width={s.width}
        height={s.height}
        className={cn("object-contain", s.img)}
      />
      <span className={cn("font-bold tracking-tight drop-shadow-sm", s.text)}>
        <span style={{ background: 'linear-gradient(180deg, #A4DB66, #2F95A3, #3C4E91)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Daily</span>
        <span style={{ background: 'linear-gradient(180deg, #FAD961, #F7A93B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Rythm</span>
      </span>
    </div>
  )
}
