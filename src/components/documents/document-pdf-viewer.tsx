"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DocumentPdfViewerProps {
  name: string;
  url: string;
  onClose: () => void;
}

export function DocumentPdfViewer({
  name,
  url,
  onClose,
}: DocumentPdfViewerProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close preview
        </Button>
      </div>
      <iframe
        src={url}
        title={name}
        className="h-pdf-viewer w-full bg-muted/20"
      />
    </Card>
  );
}
