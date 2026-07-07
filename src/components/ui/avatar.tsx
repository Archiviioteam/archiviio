import * as React from "react";
import { radius } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "size-8 text-caption",
  md: "size-10 text-body",
  lg: "size-16 text-heading",
  xl: "size-20 text-title",
} as const;

function Avatar({
  src,
  alt = "",
  fallback = "?",
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-muted/50 text-muted-foreground",
        radius.nested,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt={alt}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={cn(textStyle.bodyMedium, "select-none uppercase")}>
          {fallback.slice(0, 2)}
        </span>
      )}
    </div>
  );
}

export { Avatar };
