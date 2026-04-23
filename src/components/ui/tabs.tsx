export { Tabs, TabsContent, TabsTrigger } from "@takaki/go-design-system";

import * as React from "react";
import { TabsList as TabsListBase } from "@takaki/go-design-system";
import { cn } from "@takaki/go-design-system";

interface TabsListProps extends React.ComponentPropsWithoutRef<
  typeof TabsListBase
> {
  variant?: "default" | "underline";
}

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsListBase>,
  TabsListProps
>(({ variant, className, ...props }, ref) => (
  <TabsListBase
    ref={ref}
    className={cn(
      variant === "underline" &&
        "h-auto bg-transparent border-b border-border rounded-none p-0 gap-0",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";
