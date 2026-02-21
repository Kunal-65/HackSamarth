import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatsCard({ label, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl border border-white/5 bg-white/5 p-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <p className="mt-2 text-xs text-emerald-500 font-medium">
          {trend}
        </p>
      )}
    </div>
  );
}
