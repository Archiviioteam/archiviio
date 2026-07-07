"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { getDocumentSignedUrl } from "@/lib/documents/document-actions";
import { renderPdfThumbnail } from "@/lib/documents/render-pdf-thumbnail";
import {
  getFileTypeLabel,
  isDownloadOnlyDocument,
  isImageDocument,
  isPdfDocument,
} from "@/lib/documents/document-utils";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types/database";
import { cn } from "@/lib/utils";

interface DocumentCardPreviewProps {
  document: Document;
  className?: string;
}

export function DocumentCardPreview({
  document,
  className,
}: DocumentCardPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfThumbnailUrl, setPdfThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canPreview = !isDownloadOnlyDocument(document.file_type);
  const isImage = isImageDocument(document.file_type);
  const isPdf = isPdfDocument(document.file_type);

  useEffect(() => {
    if (!canPreview) {
      setPreviewUrl(null);
      setPdfThumbnailUrl(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setPdfThumbnailUrl(null);

    void (async () => {
      const supabase = createClient();
      const result = await getDocumentSignedUrl(supabase, document.file_url);

      if (cancelled) return;

      if (!result.ok) {
        setPreviewUrl(null);
        setLoading(false);
        return;
      }

      setPreviewUrl(result.url);

      if (isPdfDocument(document.file_type)) {
        const thumbnail = await renderPdfThumbnail(result.url);
        if (cancelled) return;
        setPdfThumbnailUrl(thumbnail);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [canPreview, document.file_type, document.file_url]);

  const content = (() => {
    if (loading) {
      return (
        <p className="text-xs text-muted-foreground">Loading preview...</p>
      );
    }

    if (isImage && previewUrl) {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={previewUrl}
          alt={document.name}
          className="size-full object-cover"
        />
      );
    }

    if (isPdf && pdfThumbnailUrl) {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={pdfThumbnailUrl}
          alt={document.name}
          className="size-full bg-white object-cover"
        />
      );
    }

    return (
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <FileText className="size-10" />
        <span className="text-xs font-medium">
          {getFileTypeLabel(document.file_type)}
        </span>
      </div>
    );
  })();

  return (
    <div
      className={cn(
        "flex size-full items-center justify-center overflow-hidden bg-muted/20",
        className
      )}
    >
      {content}
    </div>
  );
}
