"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PreferencesSection } from "@/components/settings/preferences-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { TeamSection } from "@/components/settings/team-section";
import { WorkspaceSection } from "@/components/settings/workspace-section";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { SettingsSectionPanel } from "@/components/settings/settings-section-card";
import {
  getSettingsSection,
  type SettingsSectionId,
} from "@/lib/settings/constants";
import { useAppLanguage } from "@/lib/settings/language";
import { Button } from "@/components/ui/button";

const SECTION_CONTENT = {
  profile: ProfileSection,
  workspace: WorkspaceSection,
  team: TeamSection,
  preferences: PreferencesSection,
} as const;

interface SettingsSectionPageProps {
  sectionId: SettingsSectionId;
}

export function SettingsSectionPage({ sectionId }: SettingsSectionPageProps) {
  const language = useAppLanguage();
  const section = getSettingsSection(sectionId, language);
  const SectionContent = SECTION_CONTENT[sectionId];

  return (
    <PageLayout>
      <Button variant="outline" size="sm" className="w-fit" asChild>
        <Link href="/settings">
          <ArrowLeft />
          {language === "it" ? "Impostazioni" : "Settings"}
        </Link>
      </Button>

      <PageContent>
        <SettingsSectionPanel
          sectionKey={sectionId}
          title={section.label}
          description={section.pageDescription}
        >
          <SectionContent />
        </SettingsSectionPanel>
      </PageContent>
    </PageLayout>
  );
}
