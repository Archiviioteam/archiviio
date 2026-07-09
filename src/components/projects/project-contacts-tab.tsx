"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddProjectContactDialog } from "@/components/projects/add-project-contact-dialog";
import { ContactCard, ContactListHeader } from "@/components/contacts/contact-card";
import { ContactFilters } from "@/components/contacts/contact-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { filterContacts } from "@/lib/contacts/filter-contacts";
import { fetchProjectContacts } from "@/lib/contacts/fetch-project-contacts";
import { unlinkContactFromProject } from "@/lib/contacts/unlink-contact-from-project";
import { useAppLanguage } from "@/lib/settings/language";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import type { Contact } from "@/types/database";

interface ProjectContactsTabProps {
  projectId: string;
}

export function ProjectContactsTab({ projectId }: ProjectContactsTabProps) {
  const language = useAppLanguage();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<Contact | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const loadContacts = useCallback(async () => {
    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      setContacts([]);
      setLoading(false);
      return;
    }

    const data = await fetchProjectContacts(supabase, workspaceId, projectId);
    setContacts(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const linkedContactIds = useMemo(
    () => new Set(contacts.map((contact) => contact.id)),
    [contacts]
  );

  const filteredContacts = useMemo(
    () => filterContacts(contacts, { query }),
    [contacts, query]
  );

  const hasActiveFilters = query.length > 0;

  const handleContactLinked = useCallback((contact: Contact) => {
    setContacts((current) => {
      const next = [...current, contact];
      return next.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
    });
  }, []);

  const handleUnlink = useCallback(async () => {
    if (!unlinkTarget) {
      return;
    }

    setUnlinking(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(language === "it" ? "Workspace non trovato" : "Workspace not found");
      setUnlinking(false);
      return;
    }

    const result = await unlinkContactFromProject({
      supabase,
      workspaceId,
      projectId,
      contactId: unlinkTarget.id,
      contactName: unlinkTarget.name,
    });

    setUnlinking(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      language === "it"
        ? `${unlinkTarget.name} rimosso dal progetto`
        : `${unlinkTarget.name} removed from project`
    );
    setContacts((current) =>
      current.filter((contact) => contact.id !== unlinkTarget.id)
    );
    setUnlinkTarget(null);
  }, [language, projectId, unlinkTarget]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {language === "it" ? "Caricamento contatti..." : "Loading contacts..."}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <ContactFilters
          query={query}
          onQueryChange={setQuery}
          onAddClick={() => setDialogOpen(true)}
          onClearFilters={() => setQuery("")}
        />

        {contacts.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                title={
                  language === "it"
                    ? "Nessun contatto collegato"
                    : "No contacts linked yet"
                }
                action={{
                  label: language === "it" ? "Aggiungi contatto" : "Add contact",
                  onClick: () => setDialogOpen(true),
                }}
              />
            </CardContent>
          </Card>
        ) : filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                title={
                  hasActiveFilters
                      ? language === "it"
                        ? "Nessun contatto corrisponde alla ricerca"
                        : "No contacts match your search"
                      : language === "it"
                        ? "Nessun contatto collegato"
                        : "No contacts linked yet"
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <Card className="hidden md:block">
              <CardContent className="px-4 py-2">
                <ContactListHeader />
              </CardContent>
            </Card>
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onDelete={setUnlinkTarget}
                deleteDisabled={unlinking}
                removeMode="unlink"
              />
            ))}
          </div>
        )}
      </div>

      <AddProjectContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        linkedContactIds={linkedContactIds}
        onContactLinked={handleContactLinked}
      />

      <Dialog
        open={unlinkTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUnlinkTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "it" ? "Rimuovi dal progetto" : "Remove from project"}
            </DialogTitle>
            <DialogDescription>
              {language === "it"
                ? `${unlinkTarget?.name} verra rimosso da questo progetto. Il contatto non verra eliminato dalla rubrica.`
                : `${unlinkTarget?.name} will be removed from this project. The contact will not be deleted from your contacts list.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setUnlinkTarget(null)}
              disabled={unlinking}
            >
              {language === "it" ? "Annulla" : "Cancel"}
            </Button>
            <Button
              onClick={() => void handleUnlink()}
              disabled={unlinking}
            >
              {unlinking
                ? language === "it"
                  ? "Rimozione..."
                  : "Removing..."
                : language === "it"
                  ? "Rimuovi dal progetto"
                  : "Remove from project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
