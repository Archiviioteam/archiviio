import { buildInviteEmailContent } from "@/lib/email/invite-email-content";
import { sendSmtpEmail, isSmtpConfigured } from "@/lib/email/send-smtp-email";

type SendWorkspaceInviteEmailInput = {
  to: string;
  workspaceName: string;
  inviteUrl: string;
};

async function sendViaResend(
  to: string,
  content: ReturnType<typeof buildInviteEmailContent>
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "Archiviio <onboarding@resend.dev>";

  if (!apiKey) {
    return { sent: false, error: "Resend not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: content.subject,
        html: content.html,
      }),
    });

    if (!response.ok) {
      let message = "Unable to send invitation email via Resend";
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload.message) {
          message = payload.message;
        }
      } catch {
        // ignore parse errors
      }

      return { sent: false, error: message };
    }

    return { sent: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send invitation email via Resend";
    return { sent: false, error: message };
  }
}

export async function sendWorkspaceInviteEmail({
  to,
  workspaceName,
  inviteUrl,
}: SendWorkspaceInviteEmailInput): Promise<{ sent: boolean; error?: string }> {
  const content = buildInviteEmailContent(workspaceName, inviteUrl);

  if (isSmtpConfigured()) {
    const smtpResult = await sendSmtpEmail({
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    if (smtpResult.sent) {
      return smtpResult;
    }

    const resendResult = await sendViaResend(to, content);
    if (resendResult.sent) {
      return resendResult;
    }

    return {
      sent: false,
      error: smtpResult.error || resendResult.error || "Unable to send invitation email",
    };
  }

  const resendResult = await sendViaResend(to, content);
  if (resendResult.sent) {
    return resendResult;
  }

  return {
    sent: false,
    error: resendResult.error || "Email service not configured",
  };
}
