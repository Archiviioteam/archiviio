"use client";

import type { ReactNode } from "react";
import { StatusPillBadge } from "@/components/status/status-pill-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { transition } from "@/lib/animation";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";

export interface StatusPickerOption<T extends string> {
  value: T;
  label: string;
  pillClass: string;
}

interface StatusPickerPopoverProps<T extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  value: T;
  options: StatusPickerOption<T>[];
  onSelect: (value: T) => void;
  saving?: boolean;
}

export function StatusPickerPopover<T extends string>({
  open,
  onOpenChange,
  trigger,
  value,
  options,
  onSelect,
  saving = false,
}: StatusPickerPopoverProps<T>) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="bottom"
        sideOffset={6}
        collisionPadding={8}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className={cn(
          radius.nested,
          "z-[200] w-auto min-w-0 border-border/50 bg-card/90 p-1.5 backdrop-blur-md"
        )}
      >
        <div className="flex flex-col gap-0.5">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={saving}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (saving) return;
                  if (option.value === value) {
                    onOpenChange(false);
                    return;
                  }
                  onSelect(option.value);
                }}
                className={cn(
                  "flex items-center rounded-md px-1 py-0.5",
                  transition.hover,
                  selected ? "bg-muted/80" : "hover:bg-muted/50"
                )}
              >
                <StatusPillBadge
                  label={option.label}
                  pillClass={option.pillClass}
                />
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
