"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface SensitiveFieldProps {
  value: string | null | undefined
  className?: string
  fallback?: string
}

export function SensitiveField({ value, className, fallback = "—" }: SensitiveFieldProps) {
  const [revealed, setRevealed] = useState(false)

  if (!value) return <span className={className}>{fallback}</span>

  return (
    <span className="inline-flex items-center gap-1 group">
      <span
        className={cn(
          "transition-all duration-200",
          !revealed && "blur-sm select-none cursor-pointer",
          className
        )}
        onClick={() => setRevealed(true)}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setRevealed(!revealed) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground"
        title={revealed ? "Hide" : "Show"}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </span>
  )
}
