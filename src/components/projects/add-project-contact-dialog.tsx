"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { filterContacts } from "@/lib/contacts/filter-contacts";
import { fetchWorkspaceContacts } from "@/lib/contacts/fetch-workspace-contacts";
import { linkContactToProject } from "@/lib/contacts/link-contact-to-project";
import { getContactTypeLabel } from "@/lib/contacts/contact-types";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { AppLanguage } from "@/lib/settings/preferences-storage";
import type { Contact } from "@/types/database";

interface AddProjectContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  linkedContactIds: Set<string>;
  onContactLinked: (contact: Contact) => void;
}

function contactSubtitle(contact: Contact, language: AppLanguage): string {
  const typeLabel = getContactTypeLabel(contact.type, language);
  const parts = [typeLabel, contact.company, contact.email].filter(
    (value) => value?.trim()
  );

  return parts.join(" · ") || (language === "it" ? "Nessun dettaglio" : "No details");
}

export function AddProjectContactDialog({
  open,
  onOpenChange,
  projectId,
  linkedContactIds,
  onContactLinked,
}: AddProjectContactDialogProps) {
  const language = useAppLanguage();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [linkingContactId, setLinkingContactId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setLinkingContactId(null);
      return;
    }

    async function loadContacts() {
      setLoading(true);
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);

      if (!workspaceId) {
        setContacts([]);
        setLoading(false);
        return;
      }

      const data = await fetchWorkspaceContacts(supabase, workspaceId);
      setContacts(data);
      setLoading(false);
    }

    void loadContacts();
  }, [open]);

  const availableContacts = useMemo(
    () => contacts.filter((contact) => !linkedContactIds.has(contact.id)),
    [contacts, linkedContactIds]
  );

  const filteredContacts = useMemo(
    () => filterContacts(availableContacts, { query, language }),
    [availableContacts, query, language]
  );

  async function handleSelect(contact: Contact) {
    setLinkingContactId(contact.id);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
      setLinkingContactId(null);
      return;
    }

    const result = await linkContactToProject({
      supabase,
      workspaceId,
      projectId,
      contactId: contact.id,
      contactName: contact.name,
    });

    setLinkingContactId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      language === "it"
        ? `${contact.name} aggiunto al progetto`
        : `${contact.name} added to project`
    );
    onContactLinked(result.contact);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {language === "it" ? "Aggiungi contatto" : "Add contact"}
          </DialogTitle>
          <DialogDescription>
            {language === "it"
              ? "Scegli un contatto salvato da collegare a questo progetto."
              : "Choose a saved contact to link to this project."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            {language === "it" ? "Caricamento contatti..." : "Loading contacts..."}
          </p>
        ) : contacts.length === 0 ? (
          <EmptyState
            compact
            title={language === "it" ? "Nessun contatto" : "No contacts yet"}
            action={{
              label: language === "it" ? "Crea contatto" : "Create contact",
              onClick: () => {
                onOpenChange(false);
                router.push("/contacts?action=create");
              },
            }}
          />
        ) : availableContacts.length === 0 ? (
          <EmptyState
            compact
            title={
              language === "it"
                ? "Tutti i contatti sono gia collegati"
                : "All contacts are already linked"
            }
            action={{
              label: language === "it" ? "Vai ai contatti" : "Go to contacts",
              onClick: () => {
                onOpenChange(false);
                router.push("/contacts");
              },
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <SearchInput
              placeholder={
                language === "it"
                  ? "Cerca per nome, azienda o tipo..."
                  : "Search by name, company, or type..."
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            {filteredContacts.length === 0 ? (
              <p className={cn(textStyle.body, "text-muted-foreground")}>
                {language === "it"
                  ? "Nessun contatto corrisponde alla ricerca."
                  : "No contacts match your search."}
              </p>
            ) : (
              <div className="flex max-h-list flex-col gap-1 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <Button
                    key={contact.id}
                    variant="outline"
                    className="h-auto flex-col items-start gap-0.5 px-3 py-2"
                    disabled={linkingContactId !== null}
                    onClick={() => void handleSelect(contact)}
                  >
                    <span className={cn(textStyle.bodyMedium, "text-foreground")}>
                      {contact.name}
                    </span>
                    <span className={cn(textStyle.caption, "text-muted-foreground")}>
                      {contactSubtitle(contact, language)}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
