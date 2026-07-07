import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getInviteUrl(siteUrl: string, token: string) {
  return `${siteUrl.replace(/\/$/, "")}/invite/${token}`;
}

async function sendInviteEmail(
  to: string,
  workspaceName: string,
  inviteUrl: string
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const from =
    Deno.env.get("RESEND_FROM_EMAIL")?.trim() ?? "Archiviio <onboarding@resend.dev>";

  if (!apiKey) {
    return { sent: false, error: "Email service not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Unisciti a ${workspaceName} su Archiviio`,
      html: `
        <p>Ciao,</p>
        <p>Sei stato invitato a entrare nello spazio di lavoro <strong>${workspaceName}</strong> su Archiviio.</p>
        <p><a href="${inviteUrl}">Clicca qui per unirti allo spazio</a></p>
        <p>Se il pulsante non funziona, copia e incolla questo link nel browser:</p>
        <p>${inviteUrl}</p>
      `,
    }),
  });

  if (!response.ok) {
    return { sent: false, error: "Unable to send invitation email" };
  }

  return { sent: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inviteToken, error: inviteError } = await supabaseUser.rpc(
      "invite_workspace_member",
      { invitee_email: normalizedEmail }
    );

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof inviteToken !== "string" || !inviteToken.trim()) {
      return new Response(JSON.stringify({ error: "Failed to create invitation link." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const siteUrl =
      Deno.env.get("SITE_URL") ??
      Deno.env.get("INVITE_REDIRECT_URL")?.replace(/\/auth\/callback$/, "") ??
      "http://localhost:3000";

    const inviteUrl = getInviteUrl(siteUrl, inviteToken);

    const { data: invitation } = await supabaseAdmin
      .from("workspace_invitations")
      .select("workspaces(name)")
      .eq("token", inviteToken)
      .maybeSingle();

    const workspaceName =
      invitation &&
      typeof invitation === "object" &&
      "workspaces" in invitation &&
      invitation.workspaces &&
      typeof invitation.workspaces === "object" &&
      "name" in invitation.workspaces &&
      typeof invitation.workspaces.name === "string"
        ? invitation.workspaces.name
        : "Workspace";

    const emailResult = await sendInviteEmail(
      normalizedEmail,
      workspaceName,
      inviteUrl
    );

    return new Response(
      JSON.stringify({
        inviteToken,
        inviteUrl,
        emailed: emailResult.sent,
        error: emailResult.error,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
