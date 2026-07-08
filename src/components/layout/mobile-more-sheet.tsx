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
        className="max-h-[min(72dvh,560px)] max-w-md bg-card/95 backdrop-blur-xl"
      >
        <DialogHeader className="pb-1">
          <DialogTitle>{t(language, "navigation.more")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t(language, "navigation.moreDescription")}
          </DialogDescription>
        </DialogHeader>

        <nav className="rounded-xl border border-border/70 bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-1">
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
          </div>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
