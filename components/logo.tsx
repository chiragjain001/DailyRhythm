"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/mindSync-logo.png"
        alt="MindSync Logo"
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
      />
      <span className="font-semibold tracking-tight">
        <span style={{ background: 'linear-gradient(180deg, #00E0FF, #00C2A8, #00FFA3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Mind</span>
        <span style={{ background: 'linear-gradient(180deg, #FF8A00, #FF3D6E, #FF00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sync</span>
      </span>
    </div>
  )
}
