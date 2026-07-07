import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

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

const SMTP_TIMEOUT_MS = 20_000;

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

function buildTransportOptions(config: SmtpConfig): SMTPTransport.Options {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    tls: {
      minVersion: "TLSv1.2",
      servername: config.host.replace(/^smtp(s)?\./, "smtp."),
    },
  };
}

function getFallbackConfig(config: SmtpConfig): SmtpConfig | null {
  if (config.port === 465 && config.secure) {
    return { ...config, port: 587, secure: false };
  }

  if (config.port === 587 && !config.secure) {
    return { ...config, port: 465, secure: true };
  }

  return null;
}

export function isSmtpConfigured(): boolean {
  return readSmtpConfig() !== null;
}

async function sendWithConfig(
  config: SmtpConfig,
  input: SendSmtpEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const transport = nodemailer.createTransport(buildTransportOptions(config));

  try {
    await transport.sendMail({
      from: config.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send SMTP email";
    return { sent: false, error: message };
  } finally {
    transport.close();
  }
}

export async function sendSmtpEmail(
  input: SendSmtpEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const config = readSmtpConfig();

  if (!config) {
    return { sent: false, error: "SMTP not configured" };
  }

  const primaryResult = await sendWithConfig(config, input);
  if (primaryResult.sent) {
    return primaryResult;
  }

  const fallbackConfig = getFallbackConfig(config);
  if (!fallbackConfig) {
    return primaryResult;
  }

  const fallbackResult = await sendWithConfig(fallbackConfig, input);
  if (fallbackResult.sent) {
    return fallbackResult;
  }

  return {
    sent: false,
    error: `${primaryResult.error ?? "SMTP failed"} (fallback: ${fallbackResult.error ?? "failed"})`,
  };
}
