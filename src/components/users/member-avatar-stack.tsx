import { MemberAvatar } from "@/components/users/member-avatar";
import { getMemberDisplayName, type MemberProfile } from "@/lib/users/member-display";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface MemberAvatarStackProps {
  members: MemberProfile[];
  maxVisible?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function MemberAvatarStack({
  members,
  maxVisible = 4,
  size = "xs",
  className,
}: MemberAvatarStackProps) {
  if (members.length === 0) {
    return null;
  }

  const visible = members.slice(0, maxVisible);
  const overflow = members.length - visible.length;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((member, index) => (
        <MemberAvatar
          key={member.id}
          member={member}
          size={size}
          title={getMemberDisplayName(member)}
          className={cn(index > 0 && "-ml-2")}
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            textStyle.captionMedium,
            "-ml-1 text-muted-foreground"
          )}
          title={members
            .slice(maxVisible)
            .map(getMemberDisplayName)
            .join(", ")}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
