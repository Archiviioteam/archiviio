"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { motion, transition } from "@/lib/animation";
import { radius, radiusTierProps } from "@/lib/radius";
import { elevation } from "@/lib/theme";
import { cn } from "@/lib/utils";

function DropdownMenu(props: DropdownMenuPrimitive.DropdownMenuProps) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger(
  props: DropdownMenuPrimitive.DropdownMenuTriggerProps
) {
  return (
    <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        {...radiusTierProps("surface")}
        className={cn(
          radius.surface,
          "z-50 min-w-32 overflow-hidden bg-popover p-1 text-popover-foreground",
          elevation.sm,
          motion.dropdown,
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  ...props
}: DropdownMenuPrimitive.DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        radius.control,
        "relative flex cursor-default select-none items-center gap-2 px-3 py-2 text-body outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        transition.hover,
        "focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
