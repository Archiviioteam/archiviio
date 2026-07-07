import { cva, type VariantProps } from "class-variance-authority";

import { radius } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  cn(
    "inline-flex shrink-0 items-center border border-transparent",
    radius.pill,
    textStyle.caption
  ),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        muted: "bg-muted text-foreground",
        outline: "border-border bg-background text-foreground",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-px leading-tight",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
