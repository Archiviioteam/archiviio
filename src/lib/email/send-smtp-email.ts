import nodemailer from "nodemailer";

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

type SendSmtpEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  const port = Number.parseInt(process.env.SMTP_PORT?.trim() || "465", 10);
  const secure =
    process.env.SMTP_SECURE?.trim() === "true" ||
    process.env.SMTP_SECURE?.trim() === "1" ||
    port === 465;

  return { host, port, secure, user, pass, from };
}

export function isSmtpConfigured(): boolean {
  return readSmtpConfig() !== null;
}

export async function sendSmtpEmail({
  to,
  subject,
  html,
  text,
}: SendSmtpEmailInput): Promise<{ sent: boolean; error?: string }> {
  const config = readSmtpConfig();

  if (!config) {
    return { sent: false, error: "SMTP not configured" };
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transport.sendMail({
      from: config.from,
      to,
      subject,
      html,
      text,
    });

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send SMTP email";
    return { sent: false, error: message };
  }
}
