import { ProjectDetail } from "@/components/projects/project-detail";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function ProjectDetailPage() {
  return <ProjectDetail />;
}
