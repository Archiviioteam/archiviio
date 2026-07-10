import { MemberAvatar } from "@/components/users/member-avatar";
import { getMemberDisplayName, type MemberProfile } from "@/lib/users/member-display";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface MemberAvatarStackProps {
  members: MemberProfile[];
  maxVisible?: number;
  size?: "xxs" | "xs" | "sm" | "md";
  separated?: boolean;
  className?: string;
}

export function MemberAvatarStack({
  members,
  maxVisible = 4,
  size = "xs",
  separated = false,
  className,
}: MemberAvatarStackProps) {
  if (members.length === 0) {
    return null;
  }

  const visible = members.slice(0, maxVisible);
  const overflow = members.length - visible.length;

  return (
    <div
      className={cn(
        "flex items-center",
        separated ? "gap-1" : "",
        className
      )}
    >
      {visible.map((member, index) => (
        <MemberAvatar
          key={member.id}
          member={member}
          size={size}
          title={getMemberDisplayName(member)}
          className={cn(
            !separated && index > 0 && "-ml-2",
            separated && "ring-1"
          )}
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            textStyle.captionMedium,
            separated ? "text-muted-foreground" : "-ml-1 text-muted-foreground"
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
