"use client";

import { MemberAvatar } from "@/components/users/member-avatar";
import {
  getMemberDisplayName,
  sortMembersByFirstName,
  type MemberProfile,
} from "@/lib/users/member-display";
import { useAppLanguage } from "@/lib/settings/language";
import { textStyle } from "@/lib/typography";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TaskAssigneePickerProps {
  members: MemberProfile[];
  selectedId: string | null;
  onChange: (userId: string | null) => void;
  disabled?: boolean;
}

export function TaskAssigneePicker({
  members,
  selectedId,
  onChange,
  disabled = false,
}: TaskAssigneePickerProps) {
  const language = useAppLanguage();
  const sortedMembers = sortMembersByFirstName(members);

  if (sortedMembers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>
        {language === "it" ? "Assegnata a" : "Assigned to"}
      </Label>
      <div className="flex flex-wrap gap-2">
        {sortedMembers.map((member) => {
          const selected = selectedId === member.id;

          return (
            <button
              key={member.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(member.id)}
              aria-pressed={selected}
              aria-label={getMemberDisplayName(member)}
              className={cn(
                "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <MemberAvatar member={member} size="sm" selected={selected} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
