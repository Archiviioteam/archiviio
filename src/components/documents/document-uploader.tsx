"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { uploadDocument } from "@/lib/documents/upload-document";
import { createClient } from "@/lib/supabase/client";
import {
  DOCUMENT_ALLOWED_EXTENSIONS,
  getDocumentMaxFileSizeBytes,
} from "@/lib/supabase/storage";
import { getWorkspaceId } from "@/lib/workspace";
import type { Document } from "@/types/database";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";

type UploadStatus = "uploading" | "success" | "error";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface DocumentUploaderProps {
  projectId: string;
  onUploadComplete?: (document: Document) => void;
  disabled?: boolean;
  /** @deprecated Use inputId instead */
  triggerId?: string;
  inputId?: string;
  showDropzone?: boolean;
}

function formatMaxFileSize(): string {
  const maxMb = Math.round(getDocumentMaxFileSizeBytes() / (1024 * 1024));
  return `${maxMb} MB`;
}

export function DocumentUploader({
  projectId,
  onUploadComplete,
  disabled = false,
  triggerId,
  inputId,
  showDropzone = true,
}: DocumentUploaderProps) {
  const resolvedInputId = inputId ?? triggerId;
  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const isUploading =
    isProcessing || uploads.some((item) => item.status === "uploading");

  const updateUpload = useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      setUploads((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const processFile = useCallback(
    async (file: File) => {
      const uploadId = crypto.randomUUID();

      setUploads((current) => [
        {
          id: uploadId,
          file,
          progress: 0,
          status: "uploading",
        },
        ...current,
      ]);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        const message = "Workspace not found";
        updateUpload(uploadId, { status: "error", error: message });
        toast.error(message);
        return;
      }

      const result = await uploadDocument({
        supabase,
        workspaceId,
        projectId,
        file,
        onProgress: (progress) => updateUpload(uploadId, { progress }),
      });

      if (!result.ok) {
        updateUpload(uploadId, { status: "error", error: result.error, progress: 0 });
        toast.error(result.error);
        return;
      }

      setUploads((current) => current.filter((item) => item.id !== uploadId));
      toast.success(`${file.name} uploaded`);
      onUploadComplete?.(result.document);
    },
    [onUploadComplete, projectId, updateUpload]
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (disabled || processingRef.current) return;

      const files = Array.from(fileList);
      if (files.length === 0) return;

      processingRef.current = true;
      setIsProcessing(true);
      try {
        for (const file of files) {
          await processFile(file);
        }
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [disabled, processFile]
  );

  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;
    handleFiles(event.dataTransfer.files);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
      event.target.value = "";
    }
  };

  const openFilePicker = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const allowedTypes = DOCUMENT_ALLOWED_EXTENSIONS.filter(
    (ext) => ext !== "jpeg"
  ).join(", ");

  return (
    <div className="flex flex-col gap-4">
      {showDropzone ? (
        <Card
          id={triggerId}
          variant="dashed"
          role="button"
          tabIndex={disabled || isUploading ? -1 : 0}
          aria-label="Upload documents"
          aria-disabled={disabled || isUploading}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onClick={openFilePicker}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 p-8 text-center",
            isDragging && "bg-primary/10",
            (disabled || isUploading) && "cursor-not-allowed opacity-60"
          )}
        >
          <div className={cn("flex size-12 items-center justify-center bg-muted", radius.pill)}>
            <Upload className="size-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              {isDragging
                ? "Drop files to upload"
                : "Drag files here or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              {allowedTypes} · max {formatMaxFileSize()} per file
            </p>
          </div>
          <input
            ref={inputRef}
            id={resolvedInputId}
            type="file"
            multiple
            className="hidden"
            accept={DOCUMENT_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
            onChange={onInputChange}
            disabled={disabled || isUploading}
          />
        </Card>
      ) : (
        <input
          ref={inputRef}
          id={resolvedInputId}
          type="file"
          multiple
          className="hidden"
          accept={DOCUMENT_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
          onChange={onInputChange}
          disabled={disabled || isUploading}
        />
      )}

      {showDropzone &&
        uploads.some(
          (item) => item.status === "uploading" || item.status === "error"
        ) && (
        <div className="flex flex-col gap-2">
          {uploads
            .filter(
              (item) => item.status === "uploading" || item.status === "error"
            )
            .map((item) => (
            <Card key={item.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.file.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.status === "uploading" && `${item.progress}%`}
                  {item.status === "error" && "Failed"}
                </span>
              </div>

              {item.status === "uploading" && <Progress value={item.progress} />}

              {item.status === "error" && item.error && (
                <p className="text-xs text-destructive">{item.error}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
