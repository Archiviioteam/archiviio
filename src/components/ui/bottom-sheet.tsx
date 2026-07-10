"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion as motionTokens, transition } from "@/lib/animation";
import { radiusTierProps } from "@/lib/radius";
import { elevation, overlay } from "@/lib/theme";
import { cn } from "@/lib/utils";

function BottomSheet(props: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root data-slot="bottom-sheet" {...props} />;
}

function BottomSheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="bottom-sheet-overlay"
      className={cn(
        "fixed inset-0 z-[200]",
        overlay,
        motionTokens.modalOverlay,
        className
      )}
      {...props}
    />
  );
}

function BottomSheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        data-slot="bottom-sheet-content"
        {...radiusTierProps("surface")}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[201] m-0 flex max-h-[min(72dvh,520px)] w-full flex-col gap-4 overflow-y-auto rounded-t-2xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none",
          elevation.lg,
          motionTokens.bottomSheet,
          className
        )}
        {...props}
      >
        <div
          aria-hidden
          className={cn(
            "mx-auto h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30"
          )}
        />
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function BottomSheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function BottomSheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="bottom-sheet-title"
      className={cn("text-heading font-bold text-foreground", className)}
      {...props}
    />
  );
}

function BottomSheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="bottom-sheet-description"
      className={cn("text-body text-muted-foreground", className)}
      {...props}
    />
  );
}

function BottomSheetOption({
  className,
  selected = false,
  ...props
}: React.ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left",
        transition.hover,
        selected ? "bg-muted" : "hover:bg-muted/60",
        className
      )}
      {...props}
    />
  );
}

export {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetOption,
  BottomSheetTitle,
};
