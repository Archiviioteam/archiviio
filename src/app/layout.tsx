import type { Metadata, Viewport } from "next";
import { SessionGuardRoot } from "@/components/auth/session-guard-root";
import { PreferencesInitializer } from "@/components/settings/preferences-initializer";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Archiviio",
    template: "%s · Archiviio",
  },
  description:
    "Professional workspace management for studios and freelancers",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#2a2a2e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,c=d.classList;c.remove("light","dark");if(window.matchMedia("(prefers-color-scheme: dark)").matches){c.add("dark")}else{c.add("light")}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-full bg-background font-sans text-foreground antialiased",
          "flex flex-col"
        )}
      >
        <PreferencesInitializer />
        <SessionGuardRoot>{children}</SessionGuardRoot>
        <Toaster />
      </body>
    </html>
  );
}
