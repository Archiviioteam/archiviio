import { notFound } from "next/navigation";
import { SettingsSectionPage } from "@/components/settings/settings-section-page";
import {
  isSettingsSectionId,
  SETTINGS_SECTIONS,
} from "@/lib/settings/constants";

export function generateStaticParams() {
  return SETTINGS_SECTIONS.map((section) => ({ section: section.id }));
}

export default async function SettingsSectionRoute({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!isSettingsSectionId(section)) {
    notFound();
  }

  return <SettingsSectionPage sectionId={section} />;
}
