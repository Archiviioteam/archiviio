import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { transition } from "@/lib/animation";
import { radius, radiusTierProps, type RadiusTier } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  cn("overflow-hidden bg-card text-card-foreground", transition.hover),
  {
    variants: {
      variant: {
        default: radius.surface,
        interactive: cn(radius.surface, "hover:bg-accent/50"),
        nested: cn(radius.nested, "hover:bg-accent/50"),
        dashed: cn(radius.surface, "bg-muted/30 hover:bg-muted/40"),
        muted: cn(radius.surface, "bg-muted/40"),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const CARD_RADIUS_TIER: Record<
  NonNullable<VariantProps<typeof cardVariants>["variant"]>,
  Exclude<RadiusTier, "pill" | "control" | "shell">
> = {
  default: "surface",
  interactive: "surface",
  nested: "nested",
  dashed: "surface",
  muted: "surface",
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    const tier = CARD_RADIUS_TIER[variant ?? "default"];

    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant }), className)}
        {...props}
        {...radiusTierProps(tier)}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-heading font-bold", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(textStyle.body, "text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
