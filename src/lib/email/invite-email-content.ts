export type InviteEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export function buildInviteEmailContent(
  workspaceName: string,
  inviteUrl: string
): InviteEmailContent {
  const subject = `Invito a unirti a ${workspaceName} su Archiviio`;

  const text = [
    "Ciao,",
    "",
    `Sei stato invitato a entrare nello spazio di lavoro "${workspaceName}" su Archiviio.`,
    "",
    "Apri questo link per unirti:",
    inviteUrl,
    "",
    "Se non ti aspettavi questo invito, puoi ignorare questa email.",
  ].join("\n");

  const html = `
    <p>Ciao,</p>
    <p>Sei stato invitato a entrare nello spazio di lavoro <strong>${workspaceName}</strong> su Archiviio.</p>
    <p><a href="${inviteUrl}">Unisciti allo spazio</a></p>
    <p>Se il link non funziona, copia e incolla questo indirizzo nel browser:</p>
    <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    <p>Se non ti aspettavi questo invito, puoi ignorare questa email.</p>
  `;

  return { subject, html, text };
}
