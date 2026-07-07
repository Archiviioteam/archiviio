"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isImageDocument,
  isPdfDocument,
} from "@/lib/documents/document-utils";
import type { Document } from "@/types/database";

interface DocumentPreviewDialogProps {
  document: Document | null;
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({
  document,
  url,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const name = document?.name ?? "";
  const fileType = document?.file_type ?? null;
  const isImage = isImageDocument(fileType);
  const isPdf = isPdfDocument(fileType);

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

        <div className="flex min-h-0 flex-1 bg-muted/20">
          {!url ? (
            <p className="m-auto text-sm text-muted-foreground">
              Loading preview...
            </p>
          ) : isImage ? (
            <div className="flex min-h-0 flex-1 items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              title={name}
              className="size-full border-0"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
