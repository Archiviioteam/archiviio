import { JoinWorkspaceForm } from "@/components/auth/join-workspace-form";
import { getWorkspaceInvitePreview } from "@/lib/invitations/workspace-invite";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return (
      <InviteState
        title="Invito non disponibile"
        description="Il servizio inviti non è configurato sul server."
      />
    );
  }

  const preview = await getWorkspaceInvitePreview(supabaseAdmin, token);

  if (!preview) {
    return (
      <InviteState
        title="Invito non valido"
        description="Questo link di invito non esiste o non è più valido."
      />
    );
  }

  if (preview.status === "revoked") {
    return (
      <InviteState
        title="Invito revocato"
        description="Questo invito non è più attivo. Chiedi al proprietario del workspace di inviartene uno nuovo."
      />
    );
  }

  if (preview.status === "accepted") {
    return (
      <InviteState
        title="Invito già usato"
        description="Questo invito è già stato accettato. Accedi con la tua email e password."
        actionHref="/login"
        actionLabel="Vai al login"
      />
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-1 items-center justify-center p-8">
      <JoinWorkspaceForm
        token={token}
        workspaceName={preview.workspaceName}
        invitedEmail={preview.email}
      />
    </div>
  );
}

function InviteState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {actionHref && actionLabel ? (
          <CardContent>
            <a
              href={actionHref}
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {actionLabel}
            </a>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
