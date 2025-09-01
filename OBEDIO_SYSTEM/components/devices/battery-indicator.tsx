'use client'

import { Battery, BatteryCharging, BatteryWarning } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatteryIndicatorProps {
  batteryLevel: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BatteryIndicator({ 
  batteryLevel, 
  className, 
  showPercentage = true, 
  size = 'md' 
}: BatteryIndicatorProps) {
  const getIcon = () => {
    if (batteryLevel <= 20) {
      return <BatteryWarning className={getBatteryIconClass()} />;
    } else {
      return <Battery className={getBatteryIconClass()} />;
    }
  };

  const getBatteryIconClass = () => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
    return cn(sizeClass, batteryLevel <= 20 ? 'text-red-500' : 'text-muted-foreground');
  };

  const getTextClass = () => {
    const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
    return cn(sizeClass, batteryLevel <= 20 ? 'text-red-500' : 'text-muted-foreground');
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {getIcon()}
      {showPercentage && (
        <span className={getTextClass()}>{batteryLevel}%</span>
      )}
    </div>
  );
}
