"use client";

import { transition } from "@/lib/animation";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export interface SettingsOption<T extends string> {
  value: T;
  label: string;
}

interface SettingsOptionGroupProps<T extends string> {
  value: T;
  options: SettingsOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SettingsOptionGroup<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  className,
}: SettingsOptionGroupProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-control bg-muted/30 p-1",
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-w-[5.5rem] px-3 py-2",
              radius.control,
              textStyle.bodyMedium,
              transition.hover,
              isActive
                ? "bg-card text-foreground shadow-[var(--shadow-sm)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
