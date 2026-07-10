import { Badge } from "@/components/ui/badge";
import {
  statusPillBadgeClass,
  statusPillBadgeSize,
} from "@/lib/status-pills";
import { cn } from "@/lib/utils";

interface StatusPillBadgeProps {
  label: string;
  pillClass?: string;
  className?: string;
  variant?: "filled" | "outline";
}

export function StatusPillBadge({
  label,
  pillClass,
  className,
  variant = "filled",
}: StatusPillBadgeProps) {
  if (variant === "outline") {
    return (
      <Badge size={statusPillBadgeSize} variant="outline" className={className}>
        {label}
      </Badge>
    );
  }

  return (
    <Badge
      size={statusPillBadgeSize}
      className={cn(
        statusPillBadgeClass,
        "text-black",
        pillClass,
        className
      )}
    >
      {label}
    </Badge>
  );
}
