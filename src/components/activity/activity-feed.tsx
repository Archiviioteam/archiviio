"use client";

import Link from "next/link";
import { ListItemSkeleton } from "@/components/loading/list-item-skeleton";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatActivityDate,
  type ActivityFeedItem,
} from "@/lib/activity";
import type { ModuleEmptyStatePreset } from "@/lib/empty-states";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

function ActivityListItem({
  item,
  compact = false,
  hideSubtitles = false,
  language,
}: {
  item: ActivityFeedItem;
  compact?: boolean;
  hideSubtitles?: boolean;
  language: ReturnType<typeof useAppLanguage>;
}) {
  return (
    <Card variant="interactive" asChild>
      <Link
        href={item.href}
        className={cn(
          "flex items-center justify-between",
          compact ? "gap-2 p-3 sm:gap-3 sm:p-4" : "gap-4 p-4"
        )}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className={cn(textStyle.bodyMedium, "truncate text-foreground")}>
            {item.message}
          </span>
          {!hideSubtitles && item.subtitle ? (
            <span className={cn(textStyle.caption, "truncate text-muted-foreground")}>
              {item.subtitle}
            </span>
          ) : null}
        </div>
        <span
          className={cn(
            textStyle.caption,
            "shrink-0 text-muted-foreground"
          )}
        >
          {formatActivityDate(item.timestamp, language)}
        </span>
      </Link>
    </Card>
  );
}

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  loading?: boolean;
  emptyPreset: ModuleEmptyStatePreset;
  compact?: boolean;
  hideSubtitles?: boolean;
  skeletonCount?: number;
  fill?: boolean;
}

export function ActivityFeed({
  items,
  loading = false,
  emptyPreset,
  compact = false,
  hideSubtitles = false,
  skeletonCount = 5,
  fill = false,
}: ActivityFeedProps) {
  const language = useAppLanguage();

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <ListItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        compact={compact}
        fill={fill}
        icon={emptyPreset.icon}
        title={emptyPreset.title}
        action={{
          label: emptyPreset.actionLabel,
          href: emptyPreset.actionHref,
        }}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
      {items.map((item) => (
        <ActivityListItem
          key={item.id}
          item={item}
          compact={compact}
          hideSubtitles={hideSubtitles}
          language={language}
        />
      ))}
    </div>
  );
}
