import { splitFullName } from "@/lib/settings/validation";
import type { User } from "@/types/database";

export type MemberProfile = Pick<
  User,
  "id" | "first_name" | "last_name" | "full_name" | "email" | "avatar_url"
>;

export function getMemberDisplayName(member: MemberProfile): string {
  const first = member.first_name?.trim();
  const last = member.last_name?.trim();

  if (first || last) {
    return [first, last].filter(Boolean).join(" ");
  }

  if (member.full_name?.trim()) {
    return member.full_name.trim();
  }

  return member.email;
}

export function getMemberSortKey(member: MemberProfile): string {
  const first = member.first_name?.trim();
  if (first) {
    return first.toLowerCase();
  }

  const names = splitFullName(member.full_name);
  if (names.firstName) {
    return names.firstName.toLowerCase();
  }

  return member.email.toLowerCase();
}

export function sortMembersByFirstName<T extends MemberProfile>(members: T[]): T[] {
  return [...members].sort((a, b) =>
    getMemberSortKey(a).localeCompare(getMemberSortKey(b), undefined, {
      sensitivity: "base",
    })
  );
}

export function getMemberInitials(member: MemberProfile): string {
  const name = getMemberDisplayName(member);
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}
