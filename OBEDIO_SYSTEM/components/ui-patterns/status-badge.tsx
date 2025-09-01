"use client"

import { Badge } from "@/components/ui/badge"
import { Clock, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "pending" | "in-progress" | "completed" | "failed"
  className?: string
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-500 flex items-center gap-1",
            className
          )}
        >
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
    case "in-progress":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-500 flex items-center gap-1",
            className
          )}
        >
          <Clock className="h-3 w-3" />
          In Progress
        </Badge>
      )
    case "completed":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-500 flex items-center gap-1",
            className
          )}
        >
          <Check className="h-3 w-3" />
          Completed
        </Badge>
      )
    case "failed":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-500 flex items-center gap-1",
            className
          )}
        >
          <AlertCircle className="h-3 w-3" />
          Failed
        </Badge>
      )
    default:
      return null
  }
}
