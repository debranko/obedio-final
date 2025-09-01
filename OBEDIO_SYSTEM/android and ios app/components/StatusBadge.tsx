import { cn } from "./ui/utils";

type StatusType = 
  | "new" 
  | "in-progress" 
  | "resolved" 
  | "low-battery" 
  | "offline" 
  | "online"
  | "charging"
  | "ups"
  | "ac"
  | "on-duty"
  | "off-duty";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  "new": { label: "New", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  "in-progress": { label: "In Progress", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "resolved": { label: "Resolved", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "low-battery": { label: "Low Battery", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  "offline": { label: "Offline", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  "online": { label: "Online", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "charging": { label: "Charging", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  "ups": { label: "UPS", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  "ac": { label: "AC", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "on-duty": { label: "On Duty", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  "off-duty": { label: "Off Duty", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}