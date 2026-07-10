"use client";

import { Check } from "lucide-react";
import { StatusPillBadge } from "@/components/status/status-pill-badge";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetOption,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export interface StatusPickerOption<T extends string> {
  value: T;
  label: string;
  pillClass: string;
}

interface StatusPickerSheetProps<T extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  value: T;
  options: StatusPickerOption<T>[];
  onSelect: (value: T) => void;
  saving?: boolean;
}

export function StatusPickerSheet<T extends string>({
  open,
  onOpenChange,
  title,
  description,
  value,
  options,
  onSelect,
  saving = false,
}: StatusPickerSheetProps<T>) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>{title}</BottomSheetTitle>
          {description ? (
            <BottomSheetDescription>{description}</BottomSheetDescription>
          ) : null}
        </BottomSheetHeader>

        <div className="flex flex-col gap-1">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <BottomSheetOption
                key={option.value}
                selected={selected}
                disabled={saving}
                onPointerDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  if (saving) {
                    return;
                  }
                  if (option.value === value) {
                    onOpenChange(false);
                    return;
                  }
                  onSelect(option.value);
                }}
              >
                <StatusPillBadge
                  label={option.label}
                  pillClass={option.pillClass}
                />
                {selected ? (
                  <Check className="size-4 shrink-0 text-foreground" />
                ) : (
                  <span className="size-4 shrink-0" />
                )}
              </BottomSheetOption>
            );
          })}
        </div>

        {saving ? (
          <p className={cn(textStyle.caption, "text-muted-foreground")}>
            …
          </p>
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}
