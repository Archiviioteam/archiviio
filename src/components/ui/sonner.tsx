"use client";

import { Toaster as Sonner } from "sonner";
import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: cn(
            cardVariants(),
            "text-foreground"
          ),
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
    />
  );
}
