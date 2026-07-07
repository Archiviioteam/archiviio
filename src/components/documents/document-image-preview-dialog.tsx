"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentImagePreviewDialogProps {
  name: string;
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentImagePreviewDialog({
  name,
  url,
  open,
  onOpenChange,
}: DocumentImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden bg-background p-0"
      >
        <DialogTitle className="sr-only">{name}</DialogTitle>

        <div className="px-4 py-3">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/20 p-4">
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt={name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
