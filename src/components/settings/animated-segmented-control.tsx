"use client";

import { transition } from "@/lib/animation";
import {
  settingsHubSegmentedIndicatorClass,
  settingsHubSegmentedShellClass,
} from "@/lib/settings/hub-control-styles";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface AnimatedSegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  "aria-label": string;
}

export function AnimatedSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: AnimatedSegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const segmentCount = options.length;

  return (
    <div
      className={cn(settingsHubSegmentedShellClass, className)}
      role="radiogroup"
      aria-label={ariaLabel}
      style={{ gridTemplateColumns: `repeat(${segmentCount}, minmax(0, 1fr))` }}
    >
      <div
        aria-hidden
        className={cn(
          settingsHubSegmentedIndicatorClass,
          "transition-[transform,width] duration-250 ease-out motion-reduce:transition-none"
        )}
        style={{
          width: `calc((100% - 0.5rem) / ${segmentCount})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />

      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onChange(option.value);
            }}
            className={cn(
              "relative z-10 flex min-w-0 items-center justify-center px-2 sm:px-3",
              textStyle.captionMedium,
              transition.hover,
              "disabled:cursor-not-allowed disabled:opacity-50",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="block truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
