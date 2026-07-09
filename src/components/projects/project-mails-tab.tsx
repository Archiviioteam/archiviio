"use client";

import { EmailList } from "@/components/mail/email-list";

interface ProjectMailsTabProps {
  projectId: string;
}

export function ProjectMailsTab({ projectId }: ProjectMailsTabProps) {
  return <EmailList projectId={projectId} />;
}
