'use client'

import { Signal, SignalZero, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalIndicatorProps {
  signalStrength: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SignalIndicator({ 
  signalStrength, 
  className, 
  showPercentage = true, 
  size = 'md' 
}: SignalIndicatorProps) {
  const getIcon = () => {
    if (signalStrength === 0) {
      return <SignalZero className={getSignalIconClass()} />;
    } else if (signalStrength < 30) {
      return <SignalLow className={getSignalIconClass()} />;
    } else if (signalStrength < 70) {
      return <SignalMedium className={getSignalIconClass()} />;
    } else {
      return <SignalHigh className={getSignalIconClass()} />;
    }
  };

  const getSignalIconClass = () => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
    return cn(sizeClass, signalStrength < 30 ? 'text-amber-500' : 'text-muted-foreground');
  };

  const getTextClass = () => {
    const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
    return cn(sizeClass, signalStrength < 30 ? 'text-amber-500' : 'text-muted-foreground');
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {getIcon()}
      {showPercentage && (
        <span className={getTextClass()}>{signalStrength}%</span>
      )}
    </div>
  );
}
