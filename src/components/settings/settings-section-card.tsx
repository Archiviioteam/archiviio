"use client";

import type { ReactNode } from "react";
import { textStyle } from "@/lib/typography";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingsSectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SettingsSectionCard({
  title,
  description,
  children,
  footer,
  className,
}: SettingsSectionCardProps) {
  return (
    <Card variant="nested" className={cn("border border-border/60", className)}>
      <CardHeader className="gap-1 pb-4">
        <CardTitle className={textStyle.sectionTitle}>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">{children}</CardContent>
      {footer ? (
        <div className="flex items-center justify-end gap-3 border-t border-border/60 px-6 py-4">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

interface SettingsFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className={cn(textStyle.bodyMedium, "text-foreground")}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className={cn(textStyle.caption, "text-destructive")}>{error}</p>
      ) : hint ? (
        <p className={cn(textStyle.caption, "text-muted-foreground")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SettingsSectionPanel({
  sectionKey,
  title,
  description,
  children,
}: {
  sectionKey: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div
      key={sectionKey}
      className="flex animate-in flex-col gap-6 fade-in-0 duration-250 ease-out"
    >
      <div className="flex flex-col gap-1">
        <h2 className={textStyle.pageTitle}>{title}</h2>
        <p className={cn(textStyle.body, "text-muted-foreground")}>
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
