"use client";

import { useState } from "react";
import { Download, MoreHorizontal, Trash2 } from "lucide-react";
import { DocumentCardPreview } from "@/components/documents/document-card-preview";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatUploadDate,
  isDownloadOnlyDocument,
} from "@/lib/documents/document-utils";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { radius } from "@/lib/radius";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/database";

interface DocumentCardProps {
  document: Document;
  onPreview?: () => void;
  onDownload: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function DocumentCard({
  document,
  onPreview,
  onDownload,
  onDelete,
  disabled = false,
}: DocumentCardProps) {
  const language = useAppLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const canPreview =
    !isDownloadOnlyDocument(document.file_type) && Boolean(onPreview);

  return (
    <div className="flex flex-col gap-2">
      <div className="group relative">
        <button
          type="button"
          disabled={disabled || !canPreview}
          onClick={canPreview ? onPreview : undefined}
          className={cn(
            radius.nested,
            "relative flex aspect-[16/10] w-full overflow-hidden bg-muted/30",
            canPreview && "cursor-pointer",
            !canPreview && "cursor-default"
          )}
        >
          <DocumentCardPreview
            document={document}
            className="pointer-events-none size-full"
          />
        </button>

        <div
          className={cn(
            "absolute top-2 right-2 z-10 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100",
            menuOpen && "opacity-100"
          )}
        >
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  radius.control,
                  "size-8 bg-transparent text-foreground shadow-none hover:bg-transparent"
                )}
                disabled={disabled}
                onClick={(event) => event.stopPropagation()}
                aria-label={
                  language === "it" ? "Azioni elaborato" : "Deliverable actions"
                }
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={disabled}
                onClick={() => {
                  setMenuOpen(false);
                  onDownload();
                }}
              >
                <Download className="size-4" />
                {language === "it" ? "Scarica" : "Download"}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={disabled}
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                <Trash2 className="size-4" />
                {t(language, "common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-w-0 px-0.5">
        <p
          className={cn(
            textStyle.bodyMedium,
            "line-clamp-2 break-words text-foreground sm:truncate"
          )}
          title={document.name}
        >
          {document.name}
        </p>
        <p className={cn(textStyle.caption, "mt-0.5 text-muted-foreground")}>
          {formatUploadDate(document.created_at)}
        </p>
      </div>
    </div>
  );
}
