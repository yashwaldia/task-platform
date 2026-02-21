// frontend/src/components/dashboard/StatsCard.tsx
import { type LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  /** Background class for the icon container, e.g. "bg-primary/10" */
  iconBgClass?: string;
  /** Text/color class for the icon, e.g. "text-primary" */
  iconColorClass?: string;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  iconBgClass    = 'bg-primary/10',
  iconColorClass = 'text-primary',
}: StatsCardProps) => {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
        <div
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 mt-0.5',
            iconBgClass
          )}
        >
          <Icon className={cn('h-5 w-5', iconColorClass)} />
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
