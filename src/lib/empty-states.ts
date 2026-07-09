import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  Search,
  Truck,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import type { AppLanguage } from "@/lib/settings/preferences-storage";

export interface ModuleEmptyStatePreset {
  icon: LucideIcon;
  title?: string;
  actionLabel: string;
  actionHref?: string;
}

export function getEmptyStatePresets(language: AppLanguage = "en") {
  const isItalian = language === "it";

  return {
    projects: {
      icon: FolderKanban,
      actionLabel: isItalian
        ? "Crea il tuo primo progetto"
        : "Create your first project",
      actionHref: "/projects?action=create",
    },
    projectsSearch: {
      icon: Search,
      title: isItalian
        ? "Nessun progetto corrisponde alla ricerca"
        : "No projects match your search",
      actionLabel: isItalian ? "Pulisci ricerca" : "Clear search",
    },
    documents: {
      icon: FileText,
      title: isItalian
        ? "Nessun documento di studio"
        : "No studio documents yet",
      actionLabel: isItalian
        ? "Carica documento di studio"
        : "Upload studio document",
    },
    documentsSearch: {
      icon: Search,
      title: isItalian
        ? "Nessun documento di studio corrisponde alla ricerca"
        : "No studio documents match your search",
      actionLabel: isItalian ? "Pulisci filtri" : "Clear filters",
    },
    elaborati: {
      icon: FileText,
      title: isItalian
        ? "Nessun elaborato caricato"
        : "No deliverables uploaded yet",
      actionLabel: isItalian ? "Carica elaborato" : "Upload deliverable",
    },
    elaboratiSearch: {
      icon: Search,
      title: isItalian
        ? "Nessun elaborato corrisponde alla ricerca"
        : "No deliverables match your search",
      actionLabel: isItalian ? "Pulisci filtri" : "Clear filters",
    },
    tasks: {
      icon: CheckSquare,
      title: isItalian ? "Nessuna attività" : "No tasks yet",
      actionLabel: isItalian ? "Aggiungi attività" : "Add task",
      actionHref: "/tasks",
    },
    tasksSearch: {
      icon: Search,
      title: isItalian
        ? "Nessuna attività corrisponde alla ricerca"
        : "No tasks match your search",
      actionLabel: isItalian ? "Pulisci ricerca" : "Clear search",
    },
    projectTasks: {
      icon: CheckSquare,
      title: isItalian ? "Nessuna attività" : "No tasks yet",
      actionLabel: isItalian ? "Aggiungi attività" : "Add task",
      actionHref: "/tasks",
    },
    contacts: {
      icon: Users,
      title: isItalian ? "Nessun contatto" : "No contacts yet",
      actionLabel: isItalian ? "Aggiungi contatto" : "Add contact",
      actionHref: "/contacts?action=create",
    },
    projectContacts: {
      icon: Users,
      title: isItalian
        ? "Nessun contatto collegato"
        : "No contacts linked yet",
      actionLabel: isItalian ? "Vai ai contatti" : "Go to contacts",
      actionHref: "/contacts",
    },
    suppliers: {
      icon: Truck,
      title: isItalian ? "Nessun fornitore" : "No suppliers yet",
      actionLabel: isItalian ? "Aggiungi fornitore" : "Add supplier",
      actionHref: "/suppliers?action=create",
    },
    projectSuppliers: {
      icon: Truck,
      title: isItalian
        ? "Nessun fornitore collegato"
        : "No suppliers linked yet",
      actionLabel: isItalian ? "Vai ai fornitori" : "Go to suppliers",
      actionHref: "/suppliers",
    },
    deadlines: {
      icon: Calendar,
      actionLabel: isItalian ? "Vedi attività" : "View tasks",
      actionHref: "/tasks",
    },
    activity: {
      icon: Activity,
      title: isItalian ? "Nessuna attività recente" : "No recent activity yet",
      actionLabel: isItalian
        ? "Crea il tuo primo progetto"
        : "Create your first project",
      actionHref: "/projects?action=create",
    },
    projectActivity: {
      icon: Activity,
      title: isItalian
        ? "Nessuna attività per questo progetto"
        : "No activity for this project yet",
      actionLabel: isItalian ? "Carica un elaborato" : "Upload a deliverable",
    },
    uploadNoProjects: {
      icon: FolderKanban,
      title: isItalian
        ? "Nessun progetto disponibile"
        : "No projects available",
      actionLabel: isItalian
        ? "Crea il tuo primo progetto"
        : "Create your first project",
      actionHref: "/projects?action=create",
    },
    search: {
      icon: Search,
      title: isItalian ? "Nessun risultato" : "No results found",
      actionLabel: isItalian ? "Pulisci ricerca" : "Clear search",
    },
    createContact: {
      icon: UserPlus,
      title: isItalian ? "Nessun contatto" : "No contacts yet",
      actionLabel: isItalian ? "Aggiungi contatto" : "Add contact",
      actionHref: "/contacts?action=create",
    },
    uploadDocument: {
      icon: Upload,
      title: isItalian
        ? "Nessun elaborato caricato"
        : "No deliverables uploaded yet",
      actionLabel: isItalian ? "Scegli file" : "Choose files",
    },
  } as const satisfies Record<string, ModuleEmptyStatePreset>;
}

export const emptyStatePresets = getEmptyStatePresets("en");
