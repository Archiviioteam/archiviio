import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ModuleEmptyStatePreset } from "@/lib/empty-states";

interface ProjectPlaceholderTabProps {
  preset: ModuleEmptyStatePreset;
}

export function ProjectPlaceholderTab({ preset }: ProjectPlaceholderTabProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <EmptyState
          icon={preset.icon}
          title={preset.title}
          action={{
            label: preset.actionLabel,
            href: preset.actionHref,
          }}
        />
      </CardContent>
    </Card>
  );
}
