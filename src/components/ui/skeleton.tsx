import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse bg-muted", radius.surface, className)}
      {...props}
    />
  );
}

export { Skeleton };
