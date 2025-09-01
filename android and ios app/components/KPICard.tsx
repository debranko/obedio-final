import { Card, CardContent } from "./ui/card";
import { cn } from "./ui/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  size = "md",
  className 
}: KPICardProps) {
  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  const textSizes = {
    sm: { title: "text-sm", value: "text-xl", subtitle: "text-xs" },
    md: { title: "text-sm", value: "text-2xl", subtitle: "text-sm" },
    lg: { title: "text-base", value: "text-3xl", subtitle: "text-base" }
  };

  return (
    <Card className={cn("bg-white dark:bg-card shadow-sm", className)}>
      <CardContent className={sizeClasses[size]}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn("text-muted-foreground", textSizes[size].title)}>
              {title}
            </p>
            <div className="flex items-center space-x-2">
              <p className={cn("font-semibold text-foreground", textSizes[size].value)}>
                {value}
              </p>
              {trend && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  trend.isPositive 
                    ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
                    : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className={cn("text-muted-foreground", textSizes[size].subtitle)}>
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className="text-accent">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}