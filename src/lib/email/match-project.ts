import { formatProjectCodeDisplay } from "@/lib/projects";
import type { Project } from "@/types/database";

export interface ProjectMatchContext {
  projects: Project[];
  keywordsByProjectId: Map<string, string[]>;
  contactEmailsByProjectId: Map<string, string[]>;
  supplierEmailsByProjectId: Map<string, string[]>;
  threadProjectId: string | null;
}

export interface ProjectMatchResult {
  projectId: string | null;
  confidence: number;
  rule: string | null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesPhrase(haystack: string, phrase: string): boolean {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase || normalizedPhrase.length < 3) return false;
  return normalizeText(haystack).includes(normalizedPhrase);
}

function collectCodeVariants(code: string): string[] {
  const trimmed = code.trim();
  const variants = new Set<string>([trimmed, formatProjectCodeDisplay(trimmed)]);
  const rifMatch = trimmed.match(/^rif#(.+)$/i);
  if (rifMatch) {
    variants.add(`rif#${rifMatch[1]}`);
    variants.add(`#${rifMatch[1]}`);
  }
  if (trimmed.startsWith("#")) {
    variants.add(trimmed.slice(1));
  }
  return [...variants].filter(Boolean);
}

function matchByCode(subject: string, projects: Project[]): ProjectMatchResult | null {
  const normalizedSubject = normalizeText(subject);
  for (const project of projects) {
    for (const variant of collectCodeVariants(project.code)) {
      const normalizedVariant = normalizeText(variant);
      if (normalizedVariant.length >= 3 && normalizedSubject.includes(normalizedVariant)) {
        return {
          projectId: project.id,
          confidence: 95,
          rule: "project_code",
        };
      }
    }
  }
  return null;
}

function matchByName(subject: string, projects: Project[]): ProjectMatchResult | null {
  const matches: Array<{ projectId: string; nameLength: number }> = [];
  for (const project of projects) {
    if (includesPhrase(subject, project.name)) {
      matches.push({ projectId: project.id, nameLength: project.name.length });
    }
  }
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.nameLength - a.nameLength);
  return {
    projectId: matches[0].projectId,
    confidence: matches.length === 1 ? 90 : 75,
    rule: "project_name",
  };
}

function matchByKeywords(
  subject: string,
  keywordsByProjectId: Map<string, string[]>
): ProjectMatchResult | null {
  const matches: Array<{ projectId: string; keywordLength: number }> = [];
  for (const [projectId, keywords] of keywordsByProjectId) {
    for (const keyword of keywords) {
      if (includesPhrase(subject, keyword)) {
        matches.push({ projectId, keywordLength: keyword.length });
      }
    }
  }
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.keywordLength - a.keywordLength);
  return {
    projectId: matches[0].projectId,
    confidence: matches.length === 1 ? 85 : 70,
    rule: "project_keyword",
  };
}

function matchByParticipantEmails(
  addresses: string[],
  emailsByProjectId: Map<string, string[]>,
  rule: string,
  confidence: number
): ProjectMatchResult | null {
  const normalizedAddresses = addresses
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);
  if (normalizedAddresses.length === 0) return null;

  const projectHits = new Map<string, number>();
  for (const [projectId, projectEmails] of emailsByProjectId) {
    for (const projectEmail of projectEmails) {
      const normalizedProjectEmail = projectEmail.trim().toLowerCase();
      if (normalizedAddresses.includes(normalizedProjectEmail)) {
        projectHits.set(projectId, (projectHits.get(projectId) ?? 0) + 1);
      }
    }
  }

  if (projectHits.size === 0) return null;
  const [projectId] = [...projectHits.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    projectId,
    confidence,
    rule,
  };
}

export function matchEmailToProject(input: {
  subject: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  context: ProjectMatchContext;
}): ProjectMatchResult {
  const { subject, fromAddress, toAddresses, ccAddresses, context } = input;
  const participantAddresses = [fromAddress, ...toAddresses, ...ccAddresses];

  const codeMatch = matchByCode(subject, context.projects);
  if (codeMatch) return codeMatch;

  const nameMatch = matchByName(subject, context.projects);
  if (nameMatch) return nameMatch;

  const keywordMatch = matchByKeywords(subject, context.keywordsByProjectId);
  if (keywordMatch) return keywordMatch;

  const contactMatch = matchByParticipantEmails(
    participantAddresses,
    context.contactEmailsByProjectId,
    "project_contact_email",
    80
  );
  if (contactMatch) return contactMatch;

  const supplierMatch = matchByParticipantEmails(
    participantAddresses,
    context.supplierEmailsByProjectId,
    "project_supplier_email",
    80
  );
  if (supplierMatch) return supplierMatch;

  if (context.threadProjectId) {
    return {
      projectId: context.threadProjectId,
      confidence: 70,
      rule: "email_thread",
    };
  }

  return {
    projectId: null,
    confidence: 0,
    rule: null,
  };
}
