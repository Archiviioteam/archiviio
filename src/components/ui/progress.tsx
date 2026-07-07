import { transition } from "@/lib/animation";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        "h-2 w-full overflow-hidden bg-muted",
        radius.pill,
        className
      )}
    >
      <div
        className={cn("h-full bg-primary", transition.progress)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
