import { Avatar } from "@/components/ui/avatar";
import {
  getMemberDisplayName,
  getMemberInitials,
  type MemberProfile,
} from "@/lib/users/member-display";
import { cn } from "@/lib/utils";

interface MemberAvatarProps {
  member: MemberProfile;
  size?: "xs" | "sm" | "md";
  selected?: boolean;
  className?: string;
  title?: string;
}

const sizeClasses = {
  xs: "size-7 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
} as const;

export function MemberAvatar({
  member,
  size = "sm",
  selected = false,
  className,
  title,
}: MemberAvatarProps) {
  return (
    <Avatar
      src={member.avatar_url}
      alt={getMemberDisplayName(member)}
      fallback={getMemberInitials(member)}
      title={title ?? getMemberDisplayName(member)}
      className={cn(
        "rounded-full bg-muted text-muted-foreground ring-2 ring-background",
        sizeClasses[size],
        selected && "ring-primary bg-muted/80 text-foreground",
        className
      )}
    />
  );
}
