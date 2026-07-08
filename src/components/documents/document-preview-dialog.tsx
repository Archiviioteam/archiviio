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
import { useIsMobile } from "@/lib/layout/use-is-mobile";
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
  const isMobile = useIsMobile();
  const name = document?.name ?? "";
  const fileType = document?.file_type ?? null;
  const isImage = isImageDocument(fileType);
  const isPdf = isPdfDocument(fileType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[100dvh] max-h-[100dvh] w-[100vw] max-w-[100vw] flex-col gap-0 overflow-hidden bg-background p-0 sm:h-[95vh] sm:max-h-[95vh] sm:w-[95vw] sm:max-w-[95vw]"
      >
        <DialogTitle className="sr-only">{name}</DialogTitle>

        <div className="px-4 py-3 pr-12">
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
            isMobile ? (
              <div className="m-auto flex max-w-sm flex-col items-center gap-3 px-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Anteprima PDF non ottimale su mobile.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Apri PDF
                </a>
              </div>
            ) : (
              <iframe
                src={url}
                title={name}
                className="size-full border-0"
              />
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
