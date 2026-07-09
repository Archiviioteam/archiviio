"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageContent, PageLayout } from "@/components/layout/page-layout";
import { AddContactDialog } from "@/components/contacts/add-contact-dialog";
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
import { deleteContact } from "@/lib/contacts/delete-contact";
import { filterContacts } from "@/lib/contacts/filter-contacts";
import { fetchWorkspaceContacts } from "@/lib/contacts/fetch-workspace-contacts";
import { createClient } from "@/lib/supabase/client";
import { useAppLanguage } from "@/lib/settings/language";
import { t } from "@/lib/i18n/translations";
import { getWorkspaceId } from "@/lib/workspace";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/database";

export function ContactsContent() {
  const language = useAppLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadContacts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setEditingContact(null);
      setDialogOpen(true);
      router.replace("/contacts");
    }
  }, [router, searchParams]);

  const filteredContacts = useMemo(
    () => filterContacts(contacts, { query, language }),
    [contacts, query, language]
  );

  const hasActiveFilters = query.length > 0;

  const handleContactSaved = useCallback((contact: Contact) => {
    setContacts((current) => {
      const exists = current.some((item) => item.id === contact.id);
      const next = exists
        ? current.map((item) => (item.id === contact.id ? contact : item))
        : [...current, contact];

      return next.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
    });
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingContact(null);
    }
  }, []);

  const openCreateDialog = useCallback(() => {
    setEditingContact(null);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setDialogOpen(true);
  }, []);

  const handleContactDeleted = useCallback((contactId: string) => {
    setContacts((current) => current.filter((item) => item.id !== contactId));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    const supabase = createClient();
    const workspaceId = await getWorkspaceId(supabase);

    if (!workspaceId) {
      toast.error(t(language, "common.workspaceNotFound"));
      setDeleting(false);
      return;
    }

    const result = await deleteContact({
      supabase,
      workspaceId,
      contactId: deleteTarget.id,
      name: deleteTarget.name,
    });

    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      t(language, "contacts.deletedToast").replace("{name}", deleteTarget.name)
    );
    handleContactDeleted(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, handleContactDeleted, language]);

  if (loading) {
    return (
      <PageLayout>
        <PageContent>
          <p className={cn(textStyle.body, "text-muted-foreground")}>
            {t(language, "contacts.loading")}
          </p>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageContent>
        <div className="flex flex-col gap-3">
          <ContactFilters
            query={query}
            onQueryChange={setQuery}
            onAddClick={openCreateDialog}
            onClearFilters={() => setQuery("")}
          />

          {contacts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  title={t(language, "contacts.emptyTitle")}
                  action={{
                    label: t(language, "contacts.addTitle"),
                    onClick: openCreateDialog,
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
                      ? t(language, "contacts.emptySearchTitle")
                      : t(language, "contacts.emptyTitle")
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
                  onClick={openEditDialog}
                  onDelete={setDeleteTarget}
                  deleteDisabled={deleting}
                />
              ))}
            </div>
          )}
        </div>
      </PageContent>

      <AddContactDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        contact={editingContact}
        onContactSaved={handleContactSaved}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t(language, "contacts.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t(language, "contacts.deleteDescription").replace(
                "{name}",
                deleteTarget?.name ?? ""
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              {t(language, "common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting
                ? t(language, "common.deleting")
                : t(language, "common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
