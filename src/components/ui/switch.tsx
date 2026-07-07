"use client";

import * as React from "react";
import { transition } from "@/lib/animation";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.ComponentProps<"button">, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center border border-transparent p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          radius.pill,
          transition.hover,
          checked ? "bg-primary" : "bg-muted",
          className
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none block size-5 bg-background shadow-sm",
            radius.pill,
            "transition-transform duration-200 ease-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
