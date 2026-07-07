"use client";

import { useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import { transition } from "@/lib/animation";
import { radius } from "@/lib/theme";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ImageUploadFieldProps {
  label: string;
  imageUrl?: string | null;
  fallback: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading?: boolean;
  shape?: "circle" | "square";
  hint?: string;
}

export function ImageUploadField({
  label,
  imageUrl,
  fallback,
  onUpload,
  onRemove,
  uploading = false,
  shape = "circle",
  hint,
}: ImageUploadFieldProps) {
  const language = useAppLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <span className={cn(textStyle.bodyMedium, "text-foreground")}>
        {label}
      </span>

      <div className="flex flex-wrap items-center gap-4">
        {shape === "circle" ? (
          <Avatar src={imageUrl} fallback={fallback} size="xl" />
        ) : (
          <div
            className={cn(
              "flex size-20 items-center justify-center overflow-hidden border border-border bg-muted/30",
              radius.nested
            )}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="size-full object-contain p-2"
              />
            ) : (
              <span
                className={cn(textStyle.caption, "text-muted-foreground")}
              >
                {t(language, "common.logo")}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onUpload(file);
              }
              event.target.value = "";
            }}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Camera />
            {uploading
              ? t(language, "common.uploading")
              : imageUrl
                ? t(language, "common.change")
                : t(language, "common.upload")}
          </Button>

          {imageUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={onRemove}
              className={cn("text-muted-foreground", transition.hover)}
            >
              <Trash2 />
              {t(language, "common.remove")}
            </Button>
          ) : null}
        </div>
      </div>

      {hint ? (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>{hint}</p>
      ) : null}
    </div>
  );
}
