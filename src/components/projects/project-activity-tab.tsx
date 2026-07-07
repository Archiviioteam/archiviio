"use client";

import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/activity/activity-feed";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchActivityFeed,
  PROJECT_ACTIVITY_LIMIT,
  type ActivityFeedItem,
} from "@/lib/activity";
import { getEmptyStatePresets } from "@/lib/empty-states";
import { t } from "@/lib/i18n/translations";
import { projectHref } from "@/lib/search/search-routes";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";

interface ProjectActivityTabProps {
  projectId: string;
}

export function ProjectActivityTab({ projectId }: ProjectActivityTabProps) {
  const language = useAppLanguage();
  const emptyStatePresets = getEmptyStatePresets(language);
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        if (!cancelled) setLoading(false);
        return;
      }

      const feed = await fetchActivityFeed(supabase, workspaceId, {
        projectId,
        limit: PROJECT_ACTIVITY_LIMIT,
      });

      if (!cancelled) {
        setItems(feed);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const emptyPreset = {
    ...emptyStatePresets.projectActivity,
    actionHref: projectHref(projectId, "documents"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(language, "projects.activityTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityFeed
          items={items}
          loading={loading}
          emptyPreset={emptyPreset}
          skeletonCount={6}
        />
      </CardContent>
    </Card>
  );
}
