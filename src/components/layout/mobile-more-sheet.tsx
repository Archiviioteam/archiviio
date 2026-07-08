"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMobileMoreItems } from "@/lib/layout/mobile-nav";
import { isNavItemActive } from "@/lib/layout/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearCachedWorkspaceId } from "@/lib/workspace";
import { radius } from "@/lib/radius";
import { sidebarNavItemClass } from "@/lib/theme";
import { t } from "@/lib/i18n/translations";
import { useAppLanguage } from "@/lib/settings/language";
import { cn } from "@/lib/utils";

interface MobileMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MoreNavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={sidebarNavItemClass(isActive)}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function MobileMoreSheet({ open, onOpenChange }: MobileMoreSheetProps) {
  const language = useAppLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const items = getMobileMoreItems(language);

  function handleNavigate() {
    onOpenChange(false);
  }

  async function handleSignOut() {
    onOpenChange(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    clearCachedWorkspaceId();
    router.push("/login");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-b-none rounded-t-[24px] border-0 p-0",
          "max-h-[min(72dvh,560px)] bg-background/94 backdrop-blur-2xl"
        )}
      >
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
          <DialogHeader className="px-1 pb-2">
            <DialogTitle>{t(language, "navigation.more")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t(language, "navigation.moreDescription")}
            </DialogDescription>
          </DialogHeader>

          <nav className="flex flex-col gap-1 pb-1">
            {items.map((item) => (
              <MoreNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isNavItemActive(pathname, item.href)}
                onNavigate={handleNavigate}
              />
            ))}
            <button
              type="button"
              onClick={handleSignOut}
              className={cn(sidebarNavItemClass(false), radius.control)}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="truncate">{t(language, "common.signOut")}</span>
            </button>
          </nav>
        </div>
      </DialogContent>
    </Dialog>
  );
}
