import { cn } from "./ui/utils";
import { 
  Home, 
  Bell, 
  Radio, 
  Users, 
  MoreHorizontal,
  Badge as BadgeIcon
} from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
  className?: string;
}

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "requests", label: "Requests", icon: Bell },
  { id: "devices", label: "Devices", icon: Radio },
  { id: "crew", label: "Crew", icon: Users },
  { id: "more", label: "More", icon: MoreHorizontal },
];

export function TabNavigation({ 
  activeTab, 
  onTabChange, 
  notificationCount, 
  className 
}: TabNavigationProps) {
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-border",
      "safe-area-inset-bottom",
      className
    )}>
      <nav className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === "requests" && notificationCount && notificationCount > 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors",
                "min-h-[50px] min-w-[50px]",
                isActive 
                  ? "text-accent bg-accent/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {showBadge && (
                  <div className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-medium">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </div>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}