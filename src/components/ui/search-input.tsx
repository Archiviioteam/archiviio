import * as React from "react";
import { Input } from "@/components/ui/input";
import { radius } from "@/lib/radius";
import { cn } from "@/lib/utils";

const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, type = "search", ...props }, ref) => {
  return (
    <Input
      ref={ref}
      type={type}
      className={cn(radius.pill, "px-4", className)}
      {...props}
    />
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
