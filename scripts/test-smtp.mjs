import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) {
    throw new Error("Missing .env.local");
  }

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function readConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user;
  const port = Number.parseInt(process.env.SMTP_PORT?.trim() || "465", 10);
  const secure =
    process.env.SMTP_SECURE?.trim() === "true" ||
    process.env.SMTP_SECURE?.trim() === "1" ||
    port === 465;

  if (!host || !user || !pass || !from) {
    throw new Error(
      "Missing SMTP env vars. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM to .env.local"
    );
  }

  return { host, port, secure, user, pass, from };
}

async function trySend(config, to) {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: "TLSv1.2",
      servername: config.host.replace(/^smtp(s)?\./, "smtp."),
    },
  });

  try {
    await transport.verify();
    await transport.sendMail({
      from: config.from,
      to,
      subject: "Archiviio SMTP test",
      text: "If you received this, SMTP is working.",
    });
    console.log(`OK via ${config.host}:${config.port} secure=${config.secure}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAILED via ${config.host}:${config.port} secure=${config.secure}: ${message}`);
    return false;
  } finally {
    transport.close();
  }
}

async function main() {
  loadEnv();
  const config = readConfig();
  const to = process.argv[2]?.trim() || config.user;

  console.log("SMTP config:", {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    from: config.from,
    to,
  });

  const primaryOk = await trySend(config, to);
  if (primaryOk) return;

  const fallback =
    config.port === 465
      ? { ...config, port: 587, secure: false }
      : { ...config, port: 465, secure: true };

  console.log("Trying fallback port...");
  const fallbackOk = await trySend(fallback, to);
  if (!fallbackOk) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
