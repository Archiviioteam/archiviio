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

interface ProjectMemberPickerProps {
  members: MemberProfile[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export function ProjectMemberPicker({
  members,
  selectedIds,
  onChange,
  disabled = false,
}: ProjectMemberPickerProps) {
  const language = useAppLanguage();
  const sortedMembers = sortMembersByFirstName(members);

  function toggleMember(userId: string) {
    if (disabled) return;

    const isSelected = selectedIds.includes(userId);

    if (isSelected) {
      if (selectedIds.length <= 1) {
        return;
      }
      onChange(selectedIds.filter((id) => id !== userId));
      return;
    }

    onChange([...selectedIds, userId]);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>
        {language === "it" ? "Referenti progetto" : "Project referents"}
      </Label>
      <div className="flex flex-wrap gap-2">
        {sortedMembers.map((member) => {
          const selected = selectedIds.includes(member.id);

          return (
            <button
              key={member.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleMember(member.id)}
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
      <p className={cn(textStyle.caption, "text-muted-foreground")}>
        {language === "it"
          ? "Seleziona chi segue il progetto. Almeno un referente è obbligatorio."
          : "Select who follows this project. At least one referent is required."}
      </p>
    </div>
  );
}
