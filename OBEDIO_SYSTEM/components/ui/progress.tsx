"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps {
  value?: number
  className?: string
  indicatorClassName?: string
}

const Progress: React.FC<ProgressProps> = ({ 
  value = 0, 
  className,
  indicatorClassName
}) => {
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      <div
        className={cn("h-full bg-primary transition-all", indicatorClassName)}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

Progress.displayName = "Progress"

export { Progress }