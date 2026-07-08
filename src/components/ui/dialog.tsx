"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, transition } from "@/lib/animation";
import { radius, radiusTierProps } from "@/lib/radius";
import { elevation, overlay } from "@/lib/theme";
import { cn } from "@/lib/utils";

function Dialog(props: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: DialogPrimitive.DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props: DialogPrimitive.DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props: DialogPrimitive.DialogCloseProps) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-[100]",
        overlay,
        motion.modalOverlay,
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  showMobileHandle = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  showMobileHandle?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        {...radiusTierProps("surface")}
        className={cn(
          radius.surface,
          "fixed inset-0 z-[100] m-auto flex h-fit max-h-[calc(100dvh-var(--spacing-8))] w-[calc(100%-var(--spacing-8))] max-w-4xl flex-col gap-4 overflow-y-auto overflow-x-hidden bg-card p-6 outline-none max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:m-0 max-md:h-[92dvh] max-md:max-h-[92dvh] max-md:w-full max-md:max-w-none max-md:rounded-t-3xl max-md:rounded-b-none max-md:px-5 max-md:pt-5 max-md:pb-0 max-md:touch-pan-y max-md:[&_input]:text-base max-md:[&_textarea]:text-base max-md:[&_select]:text-base",
          elevation.lg,
          motion.modalContent,
          className
        )}
        {...props}
      >
        {showMobileHandle ? (
          <div
            aria-hidden
            className="mx-auto -mt-1 mb-1 h-1.5 w-10 rounded-full bg-muted-foreground/30 md:hidden"
          />
        ) : null}

        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              "absolute top-4 right-4",
              radius.control,
              "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              transition.hover
            )}
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 pr-8", className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-heading font-bold text-foreground", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-body text-muted-foreground", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        "max-md:sticky max-md:bottom-0 max-md:z-10 max-md:mt-auto max-md:pb-[max(1rem,env(safe-area-inset-bottom))] max-md:pt-3 max-md:backdrop-blur-xl",
        "max-md:-mx-5 max-md:border-t max-md:border-border/70 max-md:bg-card/95 max-md:px-5",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
